const OAuthClient = require('intuit-oauth');

module.exports = async (req, res) => {
  try {
    const oauthClient = new OAuthClient({
      clientId: process.env.QB_CLIENT_ID,
      clientSecret: process.env.QB_CLIENT_SECRET,
      environment: process.env.QB_ENVIRONMENT || 'sandbox',
      redirectUri: process.env.QB_REDIRECT_URI || 'https://trailerbookingrrwal.vercel.app/api/quickbooks/callback',
    });

    const parseRedirect = req.url;
    const authResponse = await oauthClient.createToken(parseRedirect);

    // Store tokens (in production, you'd save these to a database)
    // For now, we'll rely on environment variables for a simpler setup
    const tokens = authResponse.getJson();

    res.send(`
      <html>
        <head><title>QuickBooks Connected</title></head>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>✅ QuickBooks Connected Successfully!</h1>
          <p>Your trailer booking system is now connected to QuickBooks.</p>
          <p style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
            <strong>IMPORTANT:</strong> Add these to your Vercel environment variables:
          </p>
          <pre style="text-align: left; background: #1a1a1a; color: #0f0; padding: 20px; border-radius: 8px; overflow-x: auto;">
QB_ACCESS_TOKEN=${tokens.access_token}
QB_REFRESH_TOKEN=${tokens.refresh_token}
QB_REALM_ID=${tokens.realmId}
          </pre>
          <p style="margin-top: 20px;">
            <a href="https://vercel.com/hbarnett2121-maker/trailerbookingrrwal/settings/environment-variables"
               style="background: #06F713; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Go to Vercel Settings
            </a>
          </p>
          <p style="margin-top: 20px; color: #666;">You can close this window after adding the variables.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('QuickBooks callback error:', error);
    res.status(500).send(`
      <html>
        <head><title>Connection Error</title></head>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>❌ Connection Failed</h1>
          <p>There was an error connecting to QuickBooks.</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><a href="/api/quickbooks/connect">Try Again</a></p>
        </body>
      </html>
    `);
  }
};
