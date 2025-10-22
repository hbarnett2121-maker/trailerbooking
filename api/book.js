export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Booking received:", req.body);
    return res.status(200).json({ ok: true, message: "Booking received successfully" });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
