// api/book.js — CORS-safe booking endpoint with email notifications
// NOTE: This endpoint is deprecated. New bookings use Stripe checkout (/api/create-checkout)
const nodemailer = require('nodemailer');

// Pricing structure
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

  if (totalHours >= 720) { // 30 days = 720 hours
    tier = "Monthly";
    price = pricing.monthly;
    breakdown = `1 month`;
  } else if (totalHours >= 168) { // 7 days = 168 hours
    tier = "Weekly";
    price = pricing.weekly;
    breakdown = `1 week`;
  } else if (totalHours >= 24) { // 24+ hours = daily rate
    tier = "Daily";
    const days = Math.ceil(totalHours / 24);
    price = pricing.daily * days;
    breakdown = `${days} day${days > 1 ? 's' : ''} × $${pricing.daily}`;
  } else { // Less than 24 hours = hourly rate
    const hours = Math.max(Math.ceil(totalHours), 2); // 2 hour minimum
    tier = "Hourly (2 hour minimum)";
    price = pricing.hourly * hours;
    breakdown = `${hours} hour${hours > 1 ? 's' : ''} × $${pricing.hourly}`;
  }

  return {
    tier,
    duration: totalHours >= 24 ? `${Math.ceil(totalHours / 24)} day${Math.ceil(totalHours / 24) > 1 ? 's' : ''}` : `${Math.ceil(totalHours)} hour${Math.ceil(totalHours) > 1 ? 's' : ''}`,
    suggestedPrice: `$${price}`,
    breakdown: breakdown
  };
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function sendBookingEmail(booking) {
  // Configure email transporter
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration missing: EMAIL_USER and EMAIL_PASS must be set in Vercel environment variables');
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

  console.log(`Attempting to send email from ${process.env.EMAIL_USER} to hbarnett2121@gmail.com`);

  // Calculate pricing
  const priceInfo = calculateRentalPrice(booking);

  const emailContent = `
NEW TRAILER BOOKING RECEIVED (LEGACY - NO PAYMENT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  NOTE: This booking came through the old system (no payment collected).
    New bookings should use Stripe payment integration.

BOOKING DETAILS:
▸ Trailer: ${booking.trailer}
▸ Start Date: ${booking.startDate}
▸ End Date: ${booking.endDate}
▸ Pickup Time: ${formatTime(booking.pickupHour)}
▸ Dropoff Time: ${formatTime(booking.dropoffHour)}

PRICING:
▸ Rental Duration: ${priceInfo?.duration || 'N/A'}
▸ Pricing Tier: ${priceInfo?.tier || 'N/A'}
▸ SUGGESTED PRICE: ${priceInfo?.suggestedPrice || 'N/A'}
${priceInfo?.breakdown ? `▸ Calculation: ${priceInfo.breakdown}` : ''}

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
This booking was automatically submitted via the Trailer Booking System.

Attachments:
▸ Driver's license photo
▸ Proof of insurance
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'hbarnett2121@gmail.com',
    subject: `🚚 New Booking: ${booking.trailer} - ${booking.firstName} ${booking.lastName}`,
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

function formatTime(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") { cors(res); return res.status(204).end(); }
  if (req.method !== "POST")   { cors(res); return res.status(405).json({ error: "Method not allowed" }); }

  try {
    cors(res);
    const booking = req.body;

    console.log("Booking received (legacy endpoint):", booking);

    // Send email notification
    try {
      await sendBookingEmail(booking);
      console.log("✓ Email sent successfully to hbarnett2121@gmail.com");
    } catch (emailError) {
      console.error("✗ Email sending failed:", emailError.message);
      console.error("Full error:", emailError);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    cors(res);
    console.error("Error processing booking:", e);
    return res.status(200).json({ ok: true });
  }
};

