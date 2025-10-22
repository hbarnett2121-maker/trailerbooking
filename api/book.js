// api/book.js — CORS-safe handler; works even without RESEND_API_KEY
const RESEND_URL = "https://api.resend.com/emails";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    setCors(res);
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    setCors(res);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    setCors(res);

    const body = req.body || {};
    const required = [
      "trailer","startDate","endDate","pickupHour","dropoffHour",
      "firstName","lastName","dob","reason"
    ];
    const missing = required.filter(k => body[k] === undefined || body[k] === "");
    if (missing.length) return res.status(400).json({ error: "Missing fields", missing });

    // If no RESEND_API_KEY yet, just acknowledge success so the UI works.
    if (!process.env.RESEND_API_KEY) {
      console.log("Booking received (email skipped):", body);
      return res.status(200).json({ ok: true, email: "skipped" });
    }

    // Send email via Resend REST API (no sdk needed)
    const to = process.env.BOOKING_TO_EMAIL || "hbarnett2121@gmail.com";
    const time = h => `${(h % 12 || 12)}:00 ${h >= 12 ? "PM" : "AM"}`;
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif">
        <h2>New Trailer Booking</h2>
        <p><b>Trailer:</b> ${body.trailer}</p>
        <p><b>Dates:</b> ${body.startDate} → ${body.endDate}</p>
        <p><b>Times:</b> ${time(body.pickupHour)} → ${time(body.dropoffHour)}</p>
        <hr/>
        <p><b>First name:</b> ${body.firstName}</p>
        <p><b>Last name:</b> ${body.lastName}</p>
        <p><b>Date of birth:</b> ${body.dob}</p>
        <p><b>Reason:</b> ${body.reason}</p>
        <p style="color:#666"><i>${new Date().toISOString()}</i></p>
      </div>
    `;

    const r = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Bookings <bookings@yourdomain.com>", // use a verified domain in Resend
        to,
        subject: `New Booking — ${body.trailer} (${body.startDate} → ${body.endDate})`,
        html
      })
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("Resend error", r.status, txt);
      // Still return ok so your UI doesn’t break
      return res.status(200).json({ ok: true, email: "failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("BOOK API error:", err);
    // Still reply 200 so your site UX doesn’t break
    setCors(res);
    return res.status(200).json({ ok: true, email: "failed" });
  }
};
