// api/book.js — uses fetch to call Resend (no npm install needed)
module.exports = async (req, res) => {
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
    if (missing.length) return res.status(400).json({ error: "Missing fields", missing });

    const to = process.env.BOOKING_TO_EMAIL || "hbarnett2121@gmail.com";
    const time = (h) => `${(h % 12 || 12)}:00 ${h >= 12 ? "PM" : "AM"}`;

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

    // Call Resend REST API directly
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Bookings <bookings@yourdomain.com>",   // use a verified domain in Resend
        to,
        subject: `New Booking — ${body.trailer} (${body.startDate} → ${body.endDate})`,
        html
      })
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("Resend error", r.status, txt);
      // Still return OK so your UI doesn't break (optional: change to 500 if you want strict failure)
      return res.status(200).json({ ok: true, email: "failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
};
