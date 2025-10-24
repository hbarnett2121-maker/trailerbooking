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

  const password = authHeader.replace('Bearer ', '');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  return password === adminPassword;
}

module.exports = async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Authenticate request
  if (!authenticate(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // GET - Retrieve all bookings
    if (req.method === "GET") {
      const bookings = await getAllBookings();
      return res.status(200).json({ bookings });
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
    return res.status(500).json({ error: error.message });
  }
};
