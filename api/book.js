// api/book.js — minimal, CORS-safe, success response
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
module.exports = async (req, res) => {
  if (req.method === "OPTIONS") { cors(res); return res.status(204).end(); }
  if (req.method !== "POST")   { cors(res); return res.status(405).json({ error: "Method not allowed" }); }

  try {
    cors(res);
    console.log("Booking received:", req.body); // see Vercel → Deployments → Runtime Logs
    return res.status(200).json({ ok: true });  // <— always succeed
  } catch (e) {
    cors(res);
    return res.status(200).json({ ok: true });  // still succeed
  }
};

