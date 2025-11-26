# Email Setup & Troubleshooting

## Why Emails Aren't Being Sent

If booking notification emails aren't arriving at `Cagleandcompany@yahoo.com`, it's because the email environment variables aren't configured in Vercel.

## Required Environment Variables

You need to set these in **Vercel Dashboard → Settings → Environment Variables**:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-app-specific-password
```

## Step-by-Step Setup

### 1. Get a Gmail Account

You need a Gmail account to send emails from. This can be:
- Your personal Gmail
- A dedicated business Gmail for the trailer company

### 2. Enable 2-Step Verification

1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow the prompts to enable it

### 3. Generate App-Specific Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other" as the device and type "Trailer Booking"
4. Click "Generate"
5. **Copy the 16-character password** (you'll need this for EMAIL_PASS)

### 4. Add Environment Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (trailerbooking)
3. Click "Settings" tab
4. Click "Environment Variables" in the left sidebar
5. Add each variable:

**EMAIL_HOST**
```
smtp.gmail.com
```

**EMAIL_PORT**
```
587
```

**EMAIL_USER**
```
your-email@gmail.com
```
(Replace with your actual Gmail address)

**EMAIL_PASS**
```
abcd efgh ijkl mnop
```
(Replace with the 16-character app password from step 3)

6. For each variable, select all environments (Production, Preview, Development)
7. Click "Save"

### 5. Redeploy

After adding the environment variables:
1. Go to "Deployments" tab in Vercel
2. Click the 3 dots on the latest deployment
3. Click "Redeploy"

## How Emails Work

### Email #1: Pending Payment (Sent Immediately)
- **When:** Customer clicks "Pay & Book" and enters their info
- **Subject:** `⏳ PENDING: [Trailer] - [Customer Name] ($X)`
- **Contains:**
  - All booking details
  - Customer information
  - Driver's license photo (attached)
  - Insurance photo (attached)
  - "Customer is currently completing payment via Stripe"

### Email #2: Payment Confirmed (Sent After Payment)
- **When:** Customer completes Stripe payment
- **Subject:** `✅ PAID: [Trailer] - [Customer Name] ($X)`
- **Contains:**
  - Booking details
  - Payment confirmation
  - Payment ID
  - "This booking is CONFIRMED and PAID"

## Stripe Webhook Setup (Required for Email #2)

For the payment confirmation email to work, you need to configure a Stripe webhook:

### 1. Go to Stripe Dashboard
https://dashboard.stripe.com/webhooks

### 2. Create Webhook Endpoint
- Click "Add endpoint"
- Endpoint URL: `https://trailerbookingrrwal.vercel.app/api/stripe-webhook`
- Description: "Trailer booking payment confirmations"

### 3. Select Events
Select this event:
- `checkout.session.completed`

### 4. Get Webhook Secret
- After creating, click on the webhook
- Click "Reveal" under "Signing secret"
- Copy the secret (starts with `whsec_`)

### 5. Add to Vercel Environment Variables
Add this variable in Vercel:
```
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

## Testing Email Setup

### Quick Test via Vercel Logs

1. Have a test customer make a booking
2. Go to Vercel Dashboard → Deployments → Latest → Functions
3. Click on `api/create-checkout`
4. Look for logs that say:
   - ✅ "✓ Pending payment email sent" (SUCCESS)
   - ❌ "✗ Email failed: ..." (ERROR - check the error message)

### Common Error Messages

**"Email not configured"**
- Solution: Add EMAIL_USER and EMAIL_PASS to Vercel

**"Authentication failed"**
- Solution: Make sure you're using an app-specific password, not your regular Gmail password

**"Invalid login"**
- Solution: Double-check EMAIL_USER is correct and 2-step verification is enabled

**"ECONNREFUSED"**
- Solution: Check EMAIL_HOST and EMAIL_PORT are correct

## Manual Testing

You can test email sending without a real booking:

1. Go to https://trailerbookingrrwal.vercel.app/api/create-checkout
2. If you see an error about missing environment variables, they're not set up

## Verification Checklist

- [ ] Gmail account created/available
- [ ] 2-Step Verification enabled on Gmail
- [ ] App-specific password generated
- [ ] EMAIL_HOST added to Vercel
- [ ] EMAIL_PORT added to Vercel
- [ ] EMAIL_USER added to Vercel
- [ ] EMAIL_PASS added to Vercel (app-specific password)
- [ ] STRIPE_WEBHOOK_SECRET added to Vercel
- [ ] Stripe webhook created and pointing to your API
- [ ] Vercel redeployed after adding variables

## Still Not Working?

### Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments"
4. Click on the latest deployment
5. Scroll down to "Functions"
6. Click on `api/create-checkout` or `api/stripe-webhook`
7. Look for error messages in the logs

### Common Issues

**Emails go to spam**
- Check Yahoo spam folder
- Add the sender email (your Gmail) to contacts

**Only Email #1 works, not Email #2**
- Stripe webhook isn't configured
- STRIPE_WEBHOOK_SECRET isn't set in Vercel

**Neither email works**
- Environment variables aren't set
- App password is wrong
- Email credentials are incorrect

## Support

If emails still aren't working after following this guide:
1. Check Vercel function logs (see above)
2. Share the error message from the logs
3. Verify all environment variables are set correctly
