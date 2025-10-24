// api/admin/bookings.js - Admin API for managing bookings
const { getAllBookings, deleteBooking } = require('../firebase');

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * Simple password authentication
 * In production, use proper JWT tokens or session management
 */
function authenticate(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;

  const password = authHeader.replace('Bearer ', '').trim();
  // TEMPORARY: Hardcoded password for testing
  const adminPassword = 'Blessed1985!';

  return password === adminPassword;
}

function authenticateWithDebug(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return {
      authenticated: false,
      debug: {
        error: 'No authorization header',
        hasEnvVar: !!process.env.ADMIN_PASSWORD
      }
    };
  }

  const password = authHeader.replace('Bearer ', '').trim();
  // TEMPORARY: Hardcoded password for testing
  const hardcodedPassword = 'Blessed1985!';
  const adminPassword = hardcodedPassword; // Use hardcoded instead of env var for now
  const match = password === adminPassword;

  console.log('🔐 Auth attempt:', {
    receivedLength: password.length,
    expectedLength: adminPassword.length,
    hasEnvVar: !!process.env.ADMIN_PASSWORD,
    match
  });

  return {
    authenticated: match,
    debug: {
      receivedPasswordLength: password.length,
      expectedPasswordLength: adminPassword.length,
      hasEnvironmentVariable: !!process.env.ADMIN_PASSWORD,
      usingHardcodedPassword: true,
      match: match,
      hint: 'TEMPORARY: Using hardcoded password Blessed1985! for testing'
    }
  };
}

module.exports = async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Authenticate request
  const authResult = authenticateWithDebug(req);
  if (!authResult.authenticated) {
    return res.status(401).json({
      error: "Unauthorized",
      debug: authResult.debug
    });
  }

  try {
    // GET - Retrieve all bookings
    if (req.method === "GET") {
      try {
        const bookings = await getAllBookings();
        return res.status(200).json({ bookings });
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Return empty array if Firebase not configured
        if (dbError.message.includes('Firestore not configured')) {
          return res.status(503).json({
            error: "Database not configured. Please set up Firebase and add FIREBASE_SERVICE_ACCOUNT to Vercel environment variables.",
            bookings: []
          });
        }
        throw dbError;
      }
    }

    // DELETE - Delete a specific booking
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Booking ID required" });
      }

      await deleteBooking(id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Admin API error:", error);
    return res.status(500).json({
      error: error.message,
      details: "Check Vercel function logs for more information"
    });
  }
};
