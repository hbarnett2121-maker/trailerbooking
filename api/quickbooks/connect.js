const OAuthClient = require('intuit-oauth');

module.exports = async (req, res) => {
  try {
    const oauthClient = new OAuthClient({
      clientId: process.env.QB_CLIENT_ID,
      clientSecret: process.env.QB_CLIENT_SECRET,
      environment: process.env.QB_ENVIRONMENT || 'sandbox',
      redirectUri: process.env.QB_REDIRECT_URI || 'https://trailerbookingrrwal.vercel.app/api/quickbooks/callback',
    });

    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.Payment],
      state: 'testState',
    });

    res.redirect(authUri);
  } catch (error) {
    console.error('QuickBooks connect error:', error);
    res.status(500).json({ error: 'Failed to initialize QuickBooks connection' });
  }
};
