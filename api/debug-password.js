// Temporary debug endpoint - DELETE AFTER TESTING
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hasEnvVar = !!process.env.ADMIN_PASSWORD;

  return res.status(200).json({
    message: "Admin password debug info",
    hasEnvironmentVariable: hasEnvVar,
    passwordLength: adminPassword.length,
    firstChar: adminPassword[0],
    lastChar: adminPassword[adminPassword.length - 1],
    // Don't expose full password, just helpful hints
    hint: hasEnvVar
      ? "ADMIN_PASSWORD is set in Vercel environment variables"
      : "Using default password from code: admin123"
  });
};
