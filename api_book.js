// api/book.js (Node on Vercel example)
// npm i resend
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const required = ['trailer','startDate','endDate','pickupHour','dropoffHour','firstName','lastName','dob','reason'];
    const miss = required.filter(k => !(k in body) || body[k]==='');
    if (miss.length) return res.status(400).json({ error:'Missing fields', miss });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = process.env.BOOKING_TO_EMAIL || 'hbarnett2121@gmail.com';
    const timeLabel = (h)=>{ const s=h>=12?'PM':'AM'; const v=h%12===0?12:h%12; return `${v}:00 ${s}`; };
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif">
        <h2>New Trailer Booking</h2>
        <p><b>Trailer:</b> ${body.trailer}</p>
        <p><b>Dates:</b> ${body.startDate} → ${body.endDate}</p>
        <p><b>Times:</b> ${timeLabel(body.pickupHour)} → ${timeLabel(body.dropoffHour)}</p>
        <hr/>
        <p><b>First name:</b> ${body.firstName}</p>
        <p><b>Last name:</b> ${body.lastName}</p>
        <p><b>Date of birth:</b> ${body.dob}</p>
        <p><b>Reason:</b> ${body.reason}</p>
        <p style="color:#666"><i>Submitted: ${new Date().toISOString()}</i></p>
      </div>
    `;
    await resend.emails.send({ from:'Bookings <bookings@yourdomain.com>', to, subject:`New Booking — ${body.trailer}`, html });
    return res.status(200).json({ ok:true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error:'Internal error' });
  }
}
