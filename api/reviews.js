// Reviews API endpoint
// Handles GET (fetch reviews) and POST (submit new review)

// Store reviews in memory for now - in production, use a database
// Reviews are stored here and manually curated by the owner
const APPROVED_REVIEWS = [
  // Add approved customer reviews here:
  // {
  //   name: "John D.",
  //   rating: 5,
  //   trailer: "8.5 x 20 Car Hauler",
  //   review: "Great trailer, easy pickup process!",
  //   date: "2025-01-15"
  // },
];

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Return approved reviews
    return res.status(200).json({ reviews: APPROVED_REVIEWS });
  }

  if (req.method === 'POST') {
    try {
      const { name, email, rating, trailer, review } = req.body;

      // Validate required fields
      const missing = [];
      if (!name) missing.push('name');
      if (!email) missing.push('email');
      if (!rating) missing.push('rating');
      if (!review) missing.push('review');

      if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      }

      // Validate rating is 1-5
      const ratingNum = parseInt(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      // Send email notification to owner about new review
      const nodemailer = require('nodemailer');

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mail.yahoo.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER;

      const emailContent = `
NEW REVIEW SUBMITTED
====================

Customer: ${name}
Email: ${email}
Rating: ${'★'.repeat(ratingNum)}${'☆'.repeat(5 - ratingNum)} (${ratingNum}/5)
Trailer: ${trailer || 'Not specified'}
Date: ${new Date().toLocaleDateString()}

Review:
${review}

====================

To approve this review, add it to the APPROVED_REVIEWS array in api/reviews.js:

{
  name: "${name.split(' ')[0]}${name.split(' ')[1] ? ' ' + name.split(' ')[1][0] + '.' : ''}",
  rating: ${ratingNum},
  trailer: "${trailer || ''}",
  review: "${review.replace(/"/g, '\\"').substring(0, 200)}${review.length > 200 ? '...' : ''}",
  date: "${new Date().toISOString().split('T')[0]}"
}
`;

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: ownerEmail,
        subject: `⭐ New ${ratingNum}-Star Review from ${name}`,
        text: emailContent,
      });

      return res.status(200).json({
        success: true,
        message: 'Thank you for your review! It will be displayed after approval.'
      });

    } catch (error) {
      console.error('Review submission error:', error);
      return res.status(500).json({
        error: 'Failed to submit review. Please try again later.',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
