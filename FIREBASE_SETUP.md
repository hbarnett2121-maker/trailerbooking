# Firebase Setup Guide

This guide will help you set up Firebase Firestore to store booking submissions and access the admin dashboard.

## Part 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name (e.g., "trailer-booking")
4. Follow the setup wizard (you can disable Google Analytics if not needed)
5. Click "Create project"

## Part 2: Enable Firestore Database

1. In your Firebase project, click "Firestore Database" in the left menu
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location (select closest to your users)
5. Click "Enable"

### Set Firestore Security Rules

1. Go to "Firestore Database" > "Rules" tab
2. Replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{booking} {
      // Allow server-side SDK (Admin SDK) full access
      allow read, write: if request.auth != null || request.time != null;
    }
  }
}
```

3. Click "Publish"

## Part 3: Get Firebase Admin Credentials

### For Backend (Vercel API)

1. In Firebase Console, go to "Project Settings" (gear icon)
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Click "Generate key" - this downloads a JSON file
5. Open the downloaded JSON file and **copy the entire contents**

### Add to Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your project (trailerbooking)
3. Go to "Settings" > "Environment Variables"
4. Add these variables:

| Variable Name | Value |
|---------------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | Paste the **entire JSON** from the downloaded file |
| `ADMIN_PASSWORD` | Choose a secure password for admin dashboard |

**Important**: Make sure to paste the complete JSON for `FIREBASE_SERVICE_ACCOUNT`, starting with `{` and ending with `}`.

## Part 4: Get Firebase Web Config (Optional - for future features)

1. In Firebase Console, go to "Project Settings"
2. Scroll down to "Your apps"
3. Click the web icon `</>`
4. Register your app with a nickname (e.g., "Trailer Booking Web")
5. Copy the configuration values

### Add to Vercel (Optional)

Add these as environment variables if needed for future features:

| Variable Name | Value |
|---------------|-------|
| `FIREBASE_API_KEY` | From config |
| `FIREBASE_AUTH_DOMAIN` | From config |
| `FIREBASE_PROJECT_ID` | From config |
| `FIREBASE_STORAGE_BUCKET` | From config |
| `FIREBASE_MESSAGING_SENDER_ID` | From config |
| `FIREBASE_APP_ID` | From config |

## Part 5: Deploy to Vercel

1. Commit and push your changes to GitHub
2. Vercel will automatically detect the changes and redeploy
3. Wait for deployment to complete

## Part 6: Access Admin Dashboard

1. Go to `https://your-vercel-url.vercel.app/admin`
2. Enter the password you set in `ADMIN_PASSWORD`
3. You should now see the booking dashboard!

## Features

### Admin Dashboard Features:

- **View all bookings** - See all submitted bookings in a table
- **Real-time stats** - Total bookings, today's bookings, upcoming bookings
- **Search** - Search by customer name, trailer, or reason
- **Filter** - Filter by trailer type and date range
- **Export to CSV** - Download bookings as CSV file
- **Delete bookings** - Remove unwanted or test bookings

### Booking Flow:

1. Customer submits booking form at `/booking`
2. Booking is saved to Firestore database
3. Email notification sent to admin
4. Admin can view/manage in dashboard at `/admin`

## Troubleshooting

### "Firebase not configured" in logs

- Make sure `FIREBASE_SERVICE_ACCOUNT` is set in Vercel environment variables
- Verify the JSON is valid (copy the entire file contents)
- Redeploy after adding environment variables

### "Unauthorized" error on admin dashboard

- Check that `ADMIN_PASSWORD` is set in Vercel environment variables
- Make sure you're using the correct password

### Bookings not appearing in dashboard

- Check Vercel logs for errors: `vercel logs`
- Verify Firestore security rules allow writes
- Make sure Firebase is initialized correctly

### Email not sending

- This is independent of database storage
- Bookings will still be saved to Firestore even if email fails
- Check email configuration in Vercel environment variables

## Security Notes

1. **Admin Password**: Use a strong password for `ADMIN_PASSWORD`
2. **Service Account**: Keep your Firebase service account JSON secure
3. **Firestore Rules**: The rules allow server-side access only
4. **HTTPS**: Vercel provides HTTPS by default

## Local Development

For local testing:

1. Copy `.env.example` to `.env`
2. Add your Firebase credentials to `.env`
3. Run: `vercel dev`

**Never commit `.env` to Git** - it contains sensitive credentials.

## Next Steps

After setup, you can:

1. Test the booking flow
2. Access the admin dashboard
3. Export booking data
4. Customize the dashboard styling
5. Add more features (booking editing, customer emails, etc.)

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Firebase Console for errors
3. Verify all environment variables are set correctly
4. Ensure your Vercel project has the latest code
