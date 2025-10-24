// api/book.js — CORS-safe booking endpoint with email notifications and Firestore storage
const nodemailer = require('nodemailer');
const { saveBooking } = require('./firebase');

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
▸ Date of Birth: ${booking.dob}
▸ Reason for Booking: ${booking.reason}

BOOKING TIMESTAMP:
▸ Created At: ${booking.createdAt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This booking was automatically submitted via the Trailer Booking System.
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'hbarnett2121@gmail.com',
    subject: `🚚 New Booking: ${booking.trailer} (${booking.startDate} - ${booking.endDate})`,
    text: emailContent,
  };

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

    // Save to Firestore database
    let savedBooking = null;
    try {
      savedBooking = await saveBooking(booking);
      if (savedBooking) {
        console.log("✓ Booking saved to database with ID:", savedBooking.id);
      }
    } catch (dbError) {
      console.error("✗ Database save failed:", dbError.message);
      // Continue even if database save fails
    }

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

    return res.status(200).json({
      ok: true,
      bookingId: savedBooking?.id
    });
  } catch (e) {
    cors(res);
    console.error("Error processing booking:", e);
    return res.status(200).json({ ok: true });
  }
};

