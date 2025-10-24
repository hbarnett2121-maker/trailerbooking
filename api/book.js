// api/book.js — CORS-safe booking endpoint with email notifications
const nodemailer = require('nodemailer');

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

  const emailContent = `
NEW TRAILER BOOKING RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOOKING DETAILS:
▸ Trailer: ${booking.trailer}
▸ Start Date: ${booking.startDate}
▸ End Date: ${booking.endDate}
▸ Pickup Time: ${formatTime(booking.pickupHour)}
▸ Dropoff Time: ${formatTime(booking.dropoffHour)}

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

