// api/reviews.js — Reviews endpoint with email notifications
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Use /tmp directory for serverless environment
const REVIEWS_FILE = path.join('/tmp', 'reviews.json');

// Initialize reviews file if it doesn't exist
function initReviewsFile() {
  if (!fs.existsSync(REVIEWS_FILE)) {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify([]));
  }
}

// Read reviews from file
function getReviews() {
  try {
    initReviewsFile();
    const data = fs.readFileSync(REVIEWS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading reviews:', error);
    return [];
  }
}

// Save reviews to file
function saveReviews(reviews) {
  try {
    initReviewsFile();
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving reviews:', error);
    return false;
  }
}

// Send email notification for new review
async function sendReviewEmail(review) {
  // Email configuration validation
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email configuration missing: EMAIL_USER and EMAIL_PASS must be set');
    return; // Don't fail the request if email is not configured
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

  const stars = '⭐'.repeat(review.rating);
  const emailContent = `
NEW CUSTOMER REVIEW RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REVIEW DETAILS:
▸ Rating: ${stars} (${review.rating}/5)
▸ Customer Name: ${review.name}
▸ Review Date: ${new Date(review.timestamp).toLocaleString('en-US')}

REVIEW TEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${review.review}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This review was automatically submitted via the Trailer Booking System.
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'hbarnett2121@gmail.com',
    subject: `${stars} New Review from ${review.name}`,
    text: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✓ Review email sent successfully');
  } catch (error) {
    console.error('✗ Review email sending failed:', error.message);
    // Don't throw - we still want to save the review
  }
}

module.exports = async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET request - Return all reviews
  if (req.method === "GET") {
    try {
      const reviews = getReviews();
      // Sort by timestamp, newest first
      reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return res.status(200).json({ reviews });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  // POST request - Submit new review
  if (req.method === "POST") {
    try {
      const review = req.body;

      // Validate required fields
      if (!review.rating || !review.name || !review.review) {
        return res.status(400).json({ error: 'Missing required fields: rating, name, review' });
      }

      // Validate rating range
      if (review.rating < 1 || review.rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      // Add timestamp if not provided
      if (!review.timestamp) {
        review.timestamp = new Date().toISOString();
      }

      // Add ID for the review
      review.id = Date.now().toString();

      // Load existing reviews
      const reviews = getReviews();

      // Add new review
      reviews.push(review);

      // Save updated reviews
      const saved = saveReviews(reviews);

      if (!saved) {
        return res.status(500).json({ error: 'Failed to save review' });
      }

      // Send email notification (non-blocking)
      sendReviewEmail(review).catch(err => {
        console.error('Email notification failed:', err);
      });

      console.log('✓ Review saved successfully:', review);

      return res.status(200).json({
        success: true,
        message: 'Review submitted successfully',
        review
      });

    } catch (error) {
      console.error('Error processing review:', error);
      return res.status(500).json({ error: 'Failed to process review' });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
