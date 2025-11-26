const Stripe = require('stripe');
const nodemailer = require('nodemailer');

function formatTime(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

async function sendPaymentConfirmationEmail(metadata, paymentId) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  const emailContent = `
✅ PAYMENT CONFIRMED - Booking Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Payment has been successfully processed via Stripe!

BOOKING DETAILS:
▸ Trailer: ${metadata.trailer}
▸ Customer: ${metadata.firstName} ${metadata.lastName}
▸ Email: ${metadata.email}
▸ Phone: ${metadata.phone}
▸ Start Date: ${metadata.startDate}
▸ End Date: ${metadata.endDate}
▸ Pickup Time: ${formatTime(parseInt(metadata.pickupHour))}
▸ Dropoff Time: ${formatTime(parseInt(metadata.dropoffHour))}

PAYMENT INFO:
▸ Amount Paid: $${metadata.price}
▸ Payment ID: ${paymentId}
▸ Pricing Tier: ${metadata.tier}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This booking is CONFIRMED and PAID.
Driver's license and insurance documents were sent in the previous "PENDING" email.
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'Cagleandcompany@yahoo.com',
    subject: `✅ PAID: ${metadata.trailer} - ${metadata.firstName} ${metadata.lastName} ($${metadata.price})`,
    text: emailContent,
  };

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
      console.log('Payment successful for booking:', session.metadata.trailer);

      // Send payment confirmation email
      await sendPaymentConfirmationEmail(
        session.metadata,
        session.payment_intent
      );
      console.log('✓ Payment confirmation email sent');

    } catch (error) {
      console.error('Error processing webhook:', error);
      // Still return 200 to Stripe so it doesn't retry
      return res.status(200).json({ received: true, error: error.message });
    }
  }

  res.status(200).json({ received: true });
};
