const Stripe = require('stripe');
const nodemailer = require('nodemailer');

function formatTime(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

async function sendBookingEmail(booking, paymentInfo) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration missing');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const emailContent = `
NEW TRAILER BOOKING RECEIVED (PAID)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOOKING DETAILS:
▸ Trailer: ${booking.trailer}
▸ Start Date: ${booking.startDate}
▸ End Date: ${booking.endDate}
▸ Pickup Time: ${formatTime(booking.pickupHour)}
▸ Dropoff Time: ${formatTime(booking.dropoffHour)}

PAYMENT CONFIRMED:
▸ Amount Paid: $${paymentInfo.amount}
▸ Payment ID: ${paymentInfo.paymentId}
▸ Pricing Tier: ${paymentInfo.tier}
▸ Calculation: ${paymentInfo.breakdown}

CUSTOMER INFORMATION:
▸ First Name: ${booking.firstName}
▸ Last Name: ${booking.lastName}
▸ Email: ${booking.email}
▸ Phone: ${booking.phone}
▸ Date of Birth: ${booking.dob}
▸ What are you hauling: ${booking.reason}
▸ Trailer Experience: ${booking.trailerExperience === 'yes' ? 'Yes, I\'ve hauled a trailer before' : 'No, I haven\'t. Can I get a walkthrough?'}

BOOKING TIMESTAMP:
▸ Created At: ${booking.createdAt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This booking was automatically submitted and PAID via the Trailer Booking System.

Attachments:
▸ Driver's license photo
▸ Proof of insurance
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'hbarnett2121@gmail.com',
    subject: `💰 PAID BOOKING: ${booking.trailer} - ${booking.firstName} ${booking.lastName} ($${paymentInfo.amount})`,
    text: emailContent,
  };

  // Attach documents
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

  await transporter.sendMail(mailOptions);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // In development, you might not have webhook secret yet
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Extract booking data from metadata
      const booking = JSON.parse(session.metadata.bookingData);
      const paymentInfo = {
        amount: session.metadata.price,
        paymentId: session.payment_intent,
        tier: session.metadata.tier,
        breakdown: session.metadata.breakdown
      };

      console.log('Payment successful for booking:', booking.trailer);

      // Send email notification
      await sendBookingEmail(booking, paymentInfo);
      console.log('✓ Email sent successfully');

    } catch (error) {
      console.error('Error processing webhook:', error);
      // Still return 200 to Stripe so it doesn't retry
      return res.status(200).json({ received: true, error: error.message });
    }
  }

  res.status(200).json({ received: true });
};
