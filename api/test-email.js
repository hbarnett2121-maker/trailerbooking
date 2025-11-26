// api/test-email.js — Simple email test endpoint
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        error: 'Email not configured',
        message: 'EMAIL_USER and EMAIL_PASS must be set in Vercel environment variables'
      });
    }

    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT) {
      return res.status(500).json({
        success: false,
        error: 'Email host/port not configured',
        message: 'EMAIL_HOST and EMAIL_PORT must be set in Vercel environment variables'
      });
    }

    console.log('Email configuration:');
    console.log('- EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('- EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('- EMAIL_USER:', process.env.EMAIL_USER);

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('Attempting to send test email...');

    const emailContent = `
TEST EMAIL - TRAILER BOOKING SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Email configuration is working correctly!

Configuration Details:
▸ SMTP Host: ${process.env.EMAIL_HOST}
▸ SMTP Port: ${process.env.EMAIL_PORT}
▸ Sender Email: ${process.env.EMAIL_USER}
▸ Test Time: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a test email from the Trailer Booking System.
You will receive booking notifications at this address.
    `.trim();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'Cagleandcompany@yahoo.com',
      subject: '✅ TEST: Email Configuration Working',
      text: emailContent,
    };

    await transporter.sendMail(mailOptions);

    console.log('✓ Test email sent successfully!');

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully to Cagleandcompany@yahoo.com',
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        from: process.env.EMAIL_USER,
        to: 'Cagleandcompany@yahoo.com'
      }
    });

  } catch (error) {
    console.error('✗ Test email failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      type: error.constructor.name,
      stack: error.stack
    });
  }
};
