const Stripe = require('stripe');
const nodemailer = require('nodemailer');

// Pricing structure (matches booking.html)
const PRICING = {
  "6 x 12 Cargo Trailer": { hourly: 20, daily: 55, weekly: 300, monthly: 1900 },
  "7 x 16 Utility Pipe Trailer": { hourly: 25, daily: 65, weekly: 350, monthly: 1100 },
  "7 x 20 Utility Trailer": { hourly: 30, daily: 75, weekly: 300, monthly: 1300 },
  "8.5 x 20 Car Hauler": { hourly: 40, daily: 95, weekly: 600, monthly: 2000 },
  "7 x 16 Utility Ramp Trailer": { hourly: 25, daily: 65, weekly: 350, monthly: 1100 },
  "5 x 10 Utility Trailer": { hourly: 15, daily: 45, weekly: 250, monthly: 750 }
};

function calculateRentalPrice(booking) {
  const pricing = PRICING[booking.trailer];
  if (!pricing) return null;

  // Calculate total rental hours (not calendar days)
  const startDateTime = new Date(booking.startDate);
  startDateTime.setHours(booking.pickupHour, 0, 0, 0);

  const endDateTime = new Date(booking.endDate);
  endDateTime.setHours(booking.dropoffHour, 0, 0, 0);

  const totalHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

  let tier, price, breakdown;

  if (totalHours >= 720) { // 30 days = 720 hours -> monthly
    const months = Math.floor(totalHours / 720);
    const remainingHours = totalHours - (months * 720);
    const remainingWeeks = Math.floor(remainingHours / 168);
    const afterWeeks = remainingHours - (remainingWeeks * 168);
    const remainingDays = Math.floor(afterWeeks / 24);
    const finalHours = Math.ceil(afterWeeks - (remainingDays * 24));

    price = (months * pricing.monthly) + (remainingWeeks * pricing.weekly) +
            (remainingDays * pricing.daily) + (finalHours * pricing.hourly);

    const parts = [];
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (remainingWeeks > 0) parts.push(`${remainingWeeks} week${remainingWeeks > 1 ? 's' : ''}`);
    if (remainingDays > 0) parts.push(`${remainingDays} day${remainingDays > 1 ? 's' : ''}`);
    if (finalHours > 0) parts.push(`${finalHours} hr${finalHours > 1 ? 's' : ''}`);

    tier = "Monthly";
    breakdown = parts.join(' + ');
  } else if (totalHours >= 168) { // 7 days = 168 hours -> weekly
    const weeks = Math.floor(totalHours / 168);
    const remainingHours = totalHours - (weeks * 168);
    const remainingDays = Math.floor(remainingHours / 24);
    const finalHours = Math.ceil(remainingHours - (remainingDays * 24));

    price = (weeks * pricing.weekly) + (remainingDays * pricing.daily) + (finalHours * pricing.hourly);

    const parts = [];
    if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
    if (remainingDays > 0) parts.push(`${remainingDays} day${remainingDays > 1 ? 's' : ''}`);
    if (finalHours > 0) parts.push(`${finalHours} hr${finalHours > 1 ? 's' : ''}`);

    tier = "Weekly";
    breakdown = parts.join(' + ');
  } else if (totalHours >= 24) { // 24+ hours = daily rate
    const days = Math.floor(totalHours / 24);
    const remainingHours = Math.ceil(totalHours - (days * 24));

    price = (days * pricing.daily) + (remainingHours * pricing.hourly);

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (remainingHours > 0) parts.push(`${remainingHours} hr${remainingHours > 1 ? 's' : ''}`);

    tier = "Daily";
    breakdown = parts.join(' + ');
  } else { // Less than 24 hours = hourly rate
    const hours = Math.max(Math.ceil(totalHours), 2); // 2 hour minimum
    tier = "Hourly (2 hour minimum)";
    price = pricing.hourly * hours;
    breakdown = `${hours} hour${hours > 1 ? 's' : ''} × $${pricing.hourly}`;
  }

  return {
    tier,
    duration: totalHours >= 24 ? `${Math.ceil(totalHours / 24)} day${Math.ceil(totalHours / 24) > 1 ? 's' : ''}` : `${Math.ceil(totalHours)} hour${Math.ceil(totalHours) > 1 ? 's' : ''}`,
    price: price,
    breakdown: breakdown
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

async function sendPendingPaymentEmail(booking, priceInfo) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured, skipping notification');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // Use SSL for port 465
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const emailContent = `
NEW TRAILER BOOKING - PENDING PAYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ Customer is currently completing payment via Stripe...

BOOKING DETAILS:
▸ Trailer: ${booking.trailer}
▸ Start Date: ${booking.startDate}
▸ End Date: ${booking.endDate}
▸ Pickup Time: ${formatTime(booking.pickupHour)}
▸ Dropoff Time: ${formatTime(booking.dropoffHour)}

PRICING:
▸ Rental Duration: ${priceInfo.duration}
▸ Pricing Tier: ${priceInfo.tier}
▸ PRICE: $${priceInfo.price}
▸ Calculation: ${priceInfo.breakdown}

CUSTOMER INFORMATION:
▸ First Name: ${booking.firstName}
▸ Last Name: ${booking.lastName}
▸ Email: ${booking.email}
▸ Phone: ${booking.phone}
▸ Date of Birth: ${booking.dob}
▸ What are you hauling: ${booking.reason}
▸ Trailer Experience: ${booking.trailerExperience === 'yes' ? 'Yes, I\'ve hauled a trailer before' : 'No, I haven\'t. Can I get a walkthrough?'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You'll receive a payment confirmation email once the customer completes checkout.

Attachments:
▸ Driver's license photo
▸ Proof of insurance
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'Cagleandcompany@yahoo.com',
    subject: `⏳ PENDING: ${booking.trailer} - ${booking.firstName} ${booking.lastName} ($${priceInfo.price})`,
    text: emailContent,
  };

  const attachments = [];
  if (booking.driversLicense && booking.driversLicenseFilename) {
    attachments.push({
      filename: booking.driversLicenseFilename,
      content: booking.driversLicense,
      encoding: 'base64'
    });
  }
  if (booking.proofOfInsurance && booking.proofOfInsuranceFilename) {
    attachments.push({
      filename: booking.proofOfInsuranceFilename,
      content: booking.proofOfInsurance,
      encoding: 'base64'
    });
  }
  if (attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✓ Pending payment email sent');
  } catch (error) {
    console.error('✗ Email failed:', error.message);
  }
}

module.exports = async (req, res) => {
  // Set CORS headers first
  cors(res);

  if (req.method === "OPTIONS") { return res.status(204).end(); }
  if (req.method !== "POST") { return res.status(405).json({ error: "Method not allowed" }); }

  try {
    console.log('=== CREATE CHECKOUT START ===');

    // Check Stripe key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      return res.status(500).json({ error: "Stripe not configured - missing API key" });
    }
    console.log('Stripe key exists:', process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...');

    // Initialize Stripe
    let stripe;
    try {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      console.log('Stripe initialized');
    } catch (stripeError) {
      console.error('Stripe initialization failed:', stripeError);
      return res.status(500).json({ error: "Stripe initialization failed: " + stripeError.message });
    }

    const booking = req.body;
    console.log('Booking received:', { trailer: booking.trailer, email: booking.email });

    // Calculate price
    const priceInfo = calculateRentalPrice(booking);
    if (!priceInfo) {
      console.error('Price calculation failed for trailer:', booking.trailer);
      return res.status(400).json({ error: "Invalid trailer or pricing" });
    }
    console.log('Price calculated:', priceInfo);

    // Send email with booking details and documents (don't let this block)
    sendPendingPaymentEmail(booking, priceInfo).catch(err => {
      console.error('Email error (non-blocking):', err.message);
    });

    // Create minimal metadata without images (to avoid size limits)
    const bookingMetadata = {
      trailer: booking.trailer || '',
      startDate: booking.startDate || '',
      endDate: booking.endDate || '',
      pickupHour: (booking.pickupHour || 0).toString(),
      dropoffHour: (booking.dropoffHour || 0).toString(),
      firstName: booking.firstName || '',
      lastName: booking.lastName || '',
      email: booking.email || '',
      phone: booking.phone || '',
      dob: booking.dob || '',
      reason: (booking.reason || '').substring(0, 500),
      trailerExperience: booking.trailerExperience || '',
      createdAt: booking.createdAt || new Date().toISOString(),
      price: priceInfo.price.toString(),
      tier: priceInfo.tier,
      hasDriversLicense: booking.driversLicense ? 'yes' : 'no',
      hasInsurance: booking.proofOfInsurance ? 'yes' : 'no'
    };

    console.log('Creating Stripe session with metadata keys:', Object.keys(bookingMetadata));

    // Create Stripe checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.create({
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
        success_url: `https://trailerbookingrrwal.vercel.app/booking?success=true`,
        cancel_url: `https://trailerbookingrrwal.vercel.app/booking?canceled=true`,
        customer_email: booking.email,
        metadata: bookingMetadata
      });
      console.log('Stripe session created:', session.id);
    } catch (stripeError) {
      console.error('Stripe session creation failed:', stripeError);
      return res.status(500).json({ error: "Stripe session failed: " + stripeError.message });
    }

    console.log('=== CREATE CHECKOUT SUCCESS ===');
    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('=== CREATE CHECKOUT ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: error.message,
      type: error.constructor.name
    });
  }
};
