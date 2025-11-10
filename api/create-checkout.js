const Stripe = require('stripe');

// Pricing structure (matches booking.html)
const PRICING = {
  "6 x 12 Cargo Trailer": { hourly: 20, daily: 55, weekly: 300, monthly: 1900 },
  "7 x 16 Utility Pipe Trailer": { hourly: 25, daily: 65, weekly: 350, monthly: 1100 },
  "7 x 20 Utility Trailer": { hourly: 30, daily: 75, weekly: 300, monthly: 1300 },
  "6 x 12 Car Hauler": { hourly: 40, daily: 95, weekly: 600, monthly: 2000 },
  "7 x 16 Utility Ramp Trailer": { hourly: 25, daily: 65, weekly: 350, monthly: 1100 },
  "5 x 10 Utility Trailer": { hourly: 15, daily: 45, weekly: 250, monthly: 750 }
};

function calculateRentalPrice(booking) {
  const pricing = PRICING[booking.trailer];
  if (!pricing) return null;

  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const diffHours = (booking.dropoffHour - booking.pickupHour) + ((diffDays - 1) * 24);

  let tier, price, minHours;

  if (diffDays >= 30) {
    tier = "Monthly";
    price = pricing.monthly;
  } else if (diffDays >= 7) {
    tier = "Weekly";
    price = pricing.weekly;
  } else if (diffDays > 1 || diffHours >= 24) {
    tier = "Daily";
    price = pricing.daily * diffDays;
  } else {
    tier = "Hourly (2 hour minimum)";
    minHours = Math.max(diffHours, 2);
    price = pricing.hourly * minHours;
  }

  return {
    tier,
    duration: diffDays > 1 ? `${diffDays} days` : `${diffHours} hours`,
    price: price,
    breakdown: diffDays > 1
      ? `${diffDays} days × $${tier === 'Daily' ? pricing.daily : price}`
      : `${minHours || diffHours} hours × $${pricing.hourly}`
  };
}

function formatTime(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") { cors(res); return res.status(204).end(); }
  if (req.method !== "POST") { cors(res); return res.status(405).json({ error: "Method not allowed" }); }

  try {
    cors(res);

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const booking = req.body;

    // Calculate price
    const priceInfo = calculateRentalPrice(booking);
    if (!priceInfo) {
      return res.status(400).json({ error: "Invalid trailer or pricing" });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${booking.trailer} Rental`,
              description: `${booking.startDate} to ${booking.endDate} (${formatTime(booking.pickupHour)} - ${formatTime(booking.dropoffHour)})\n${priceInfo.tier} - ${priceInfo.breakdown}`,
            },
            unit_amount: priceInfo.price * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VERCEL_URL || 'https://trailerbookingrrwal.vercel.app'}/booking?success=true`,
      cancel_url: `${process.env.VERCEL_URL || 'https://trailerbookingrrwal.vercel.app'}/booking?canceled=true`,
      customer_email: booking.email,
      metadata: {
        // Store all booking data in metadata so webhook can access it
        bookingData: JSON.stringify(booking),
        price: priceInfo.price.toString(),
        tier: priceInfo.tier,
        breakdown: priceInfo.breakdown
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    cors(res);
    return res.status(500).json({ error: error.message });
  }
};
