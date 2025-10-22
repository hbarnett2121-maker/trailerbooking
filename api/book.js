// api/book.js — CORS-safe minimal handler (no external deps)
const allowOrigin = process.env.ALLOW_ORIGIN || "*"; // or set to "https://cagleandcompany.com"

module.exports = async (req, res) => {
  // CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight for browsers
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const required = [
      "trailer","startDate","endDate","pickupHour","dropoffHour",
      "firstName","lastName","dob","reason"
    ];
    const missing = required.filter(k => body[k] === undefined || body[k] === "");
    if (missing.length) {
      return res.status(400).json({ error: "Missing fields", missing });
    }

    // TODO: store to DB / send email here (after this works)

    // Always succeed so the front-end shows "Booking submitted!"
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("book.js error:", e);
    return res.status(500).json({ error: "Internal error" });
  }
};

