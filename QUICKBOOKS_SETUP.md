# QuickBooks Integration Setup Guide

## Overview
Your trailer booking system now automatically creates QuickBooks invoices when customers submit bookings. You review the booking, then send the invoice to the customer from QuickBooks.

## Setup Steps

### 1. Add Your QuickBooks Credentials to Vercel

Go to your Vercel project environment variables:
https://vercel.com/hbarnett2121-maker/trailerbookingrrwal/settings/environment-variables

Add these variables:

```
QB_CLIENT_ID=ABXmfz3qTVRsHC3R7U919cPombACAKnTrKastAaw0UfjObjxcj
QB_CLIENT_SECRET=ialQXPfYiBG9hwjfHIfURTKnSMMrILwof4tLDRdh
QB_REDIRECT_URI=https://trailerbookingrrwal.vercel.app/api/quickbooks/callback
QB_ENVIRONMENT=sandbox
```

**Important:**
- Use `QB_ENVIRONMENT=sandbox` for testing
- Change to `QB_ENVIRONMENT=production` when you're ready to go live

### 2. Connect Your QuickBooks Account

After deploying the code:

1. Visit: **https://trailerbookingrrwal.vercel.app/api/quickbooks/connect**
2. You'll be redirected to QuickBooks to authorize the connection
3. Click "Connect" to authorize
4. You'll be redirected back with your access tokens

### 3. Add the Access Tokens to Vercel

The callback page will show you three more environment variables to add:

```
QB_ACCESS_TOKEN=<your access token>
QB_REFRESH_TOKEN=<your refresh token>
QB_REALM_ID=<your realm id>
```

Copy these and add them to your Vercel environment variables.

### 4. Redeploy Your Application

After adding all the environment variables, trigger a new deployment in Vercel so the changes take effect.

## How It Works

### Customer Flow:
1. Customer fills out booking form
2. Customer sees estimated price
3. Customer submits booking
4. System creates QuickBooks invoice automatically (as draft)

### Your Flow:
1. You receive email notification with:
   - Booking details
   - Customer information
   - Driver's license & insurance photos
   - **QuickBooks invoice link**
2. You click the invoice link to review in QuickBooks
3. You approve the booking
4. You send the invoice to customer from QuickBooks
5. Customer receives invoice with payment link
6. Customer pays online through QuickBooks

## Switching from Sandbox to Production

When you're ready to use real QuickBooks data:

1. Change `QB_ENVIRONMENT=production` in Vercel
2. Reconnect to QuickBooks by visiting `/api/quickbooks/connect` again
3. Update the access tokens in Vercel with the new production tokens

## Troubleshooting

### Invoice not created?
- Check Vercel logs for errors
- Verify all environment variables are set correctly
- Make sure you've connected your QuickBooks account

### Can't connect to QuickBooks?
- Verify your Client ID and Client Secret are correct
- Make sure the Redirect URI matches exactly in both QuickBooks Developer Portal and Vercel

### Access token expired?
QuickBooks access tokens expire after 1 hour. If invoices stop being created:
- Reconnect your account by visiting `/api/quickbooks/connect`
- Update the new access token in Vercel

**Note:** In a production system, you'd implement automatic token refresh. For now, you can manually reconnect when needed.

## Support

If you encounter issues:
1. Check Vercel function logs for detailed error messages
2. Verify all environment variables are set
3. Make sure QuickBooks Payments is enabled in your QuickBooks account
