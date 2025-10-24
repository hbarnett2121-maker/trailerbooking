# Trailer Booking System

A simple trailer booking system with calendar interface and email notifications.

## Features

### Customer Booking Interface (`/booking`)
- Interactive calendar to select booking dates
- Trailer selection (multiple trailers supported)
- Pickup and dropoff time selection
- Customer information form
- Real-time availability checking
- Email confirmations sent to admin

### Email Notifications
- Instant email notification for each booking
- Includes all booking details (trailer, dates, times)
- Includes customer information (name, DOB, reason)
- Sent to: hbarnett2121@gmail.com

## Project Structure

```
trailerbooking/
├── booking.html         # Customer booking interface
├── api/
│   └── book.js          # Booking submission endpoint (sends email)
├── package.json         # Dependencies
├── vercel.json          # Vercel deployment config
└── .env.example         # Environment variable template
```

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd trailerbooking
npm install
```

### 2. Configure Email

In Vercel dashboard, add these environment variables:

**Email Configuration:**
- `EMAIL_HOST` - SMTP server (default: smtp.gmail.com)
- `EMAIL_PORT` - SMTP port (default: 587)
- `EMAIL_USER` - Your email address
- `EMAIL_PASS` - App-specific password

See `.env.example` for details.

### 3. Gmail Setup

1. Enable 2-Step Verification in Google Account
2. Generate App-Specific Password:
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Copy the generated password
3. Use this password as `EMAIL_PASS` in environment variables

### 4. Deploy to Vercel

```bash
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Usage

### For Customers

1. Visit `https://your-domain.vercel.app/booking`
2. Select trailer and dates
3. Fill in personal information
4. Submit booking
5. Admin receives email notification

### For Admins

Check your email inbox at `hbarnett2121@gmail.com` for booking notifications.

Each email includes:
- Trailer name
- Start and end dates
- Pickup and dropoff times
- Customer name
- Customer email address
- Customer phone number
- Date of birth
- Reason for booking
- Timestamp
- Driver's license photo (attached)

## API Endpoints

### `POST /api/book`
Submit a new booking

**Request:**
```json
{
  "trailer": "Trailer 1",
  "startDate": "2025-10-25",
  "endDate": "2025-10-27",
  "pickupHour": 10,
  "dropoffHour": 16,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "(555) 123-4567",
  "dob": "1990-01-01",
  "driversLicense": "base64-encoded-image-data",
  "driversLicenseFilename": "license.jpg",
  "reason": "Moving",
  "createdAt": "2025-10-24T12:00:00Z"
}
```

**Response:**
```json
{
  "ok": true
}
```

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env

# Run locally with Vercel CLI
vercel dev
```

Visit: http://localhost:3000/booking

## Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Vercel Serverless Functions
- **Email**: Nodemailer (Gmail SMTP)
- **Hosting**: Vercel

## Security

- HTTPS enforced by Vercel
- Environment variables for sensitive credentials
- CORS enabled for API endpoints

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers supported

## Troubleshooting

### Email not sending
- Verify email environment variables in Vercel
- Check Gmail app password is correct
- Review Vercel function logs: `vercel logs`
- Ensure 2-Step Verification is enabled on Gmail

### Bookings not submitted
- Check browser console for errors
- Verify API endpoint is accessible
- Check Vercel deployment status

## Email Format

Each booking email includes:

```
NEW TRAILER BOOKING RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOOKING DETAILS:
▸ Trailer: [trailer name]
▸ Start Date: [date]
▸ End Date: [date]
▸ Pickup Time: [time]
▸ Dropoff Time: [time]

CUSTOMER INFORMATION:
▸ First Name: [name]
▸ Last Name: [name]
▸ Email: [email]
▸ Phone: [phone]
▸ Date of Birth: [DOB]
▸ Reason for Booking: [reason]

BOOKING TIMESTAMP:
▸ Created At: [ISO timestamp]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This booking was automatically submitted via the Trailer Booking System.

Driver's license photo is attached to this email.
```

**Note:** The customer's driver's license photo will be attached as an image file to the email.

## License

MIT

## Support

For issues or questions:
1. Check Vercel deployment logs
2. Verify environment variables configuration
3. Review Gmail app password setup
