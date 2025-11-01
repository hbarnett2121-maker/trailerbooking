// api/book.js — CORS-safe booking endpoint with email notifications
const nodemailer = require('nodemailer');

// Pricing structure
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

  // Calculate duration
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both days
  const diffHours = (booking.dropoffHour - booking.pickupHour) + ((diffDays - 1) * 24);

  // Determine pricing tier and calculate
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
    suggestedPrice: `$${price}`,
    breakdown: diffDays > 1
      ? `${diffDays} days × $${tier === 'Daily' ? pricing.daily : price}`
      : `${minHours || diffHours} hours × $${pricing.hourly}`
  };
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function sendBookingEmail(booking) {
  // Configure email transporter
  // You'll need to set these environment variables in Vercel:
  // EMAIL_HOST (e.g., smtp.gmail.com)
  // EMAIL_PORT (e.g., 587)
  // EMAIL_USER (your email address)
  // EMAIL_PASS (your email password or app-specific password)

  // Validate required environment variables
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
NEW TRAILER BOOKING RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

→ Review booking and send QuickBooks invoice for ${priceInfo?.suggestedPrice || 'calculated amount'}

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

    console.log("Booking received:", booking);

    // Send email notification
    try {
      await sendBookingEmail(booking);
      console.log("✓ Email sent successfully to hbarnett2121@gmail.com");
    } catch (emailError) {
      console.error("✗ Email sending failed:", emailError.message);
      console.error("Full error:", emailError);
      // Continue even if email fails - don't block the booking
      // But we should log this prominently so it shows up in Vercel logs
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    cors(res);
    console.error("Error processing booking:", e);
    return res.status(200).json({ ok: true });
  }
};

