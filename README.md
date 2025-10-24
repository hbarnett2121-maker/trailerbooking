# Trailer Booking System

A complete trailer booking system with calendar interface, email notifications, and admin dashboard.

## Features

### Customer Booking Interface (`/booking`)
- Interactive calendar to select booking dates
- Trailer selection (multiple trailers supported)
- Pickup and dropoff time selection
- Customer information form
- Real-time availability checking
- Confirmation emails

### Admin Dashboard (`/admin`)
- View all bookings in a sortable table
- Real-time statistics (total, today, upcoming)
- Search and filter functionality
- Export bookings to CSV
- Delete/manage bookings
- Password-protected access

### Backend
- Email notifications via Nodemailer (Gmail SMTP)
- Firebase Firestore database storage
- RESTful API endpoints
- Vercel serverless functions

## Project Structure

```
trailerbooking/
├── booking.html          # Customer booking interface
├── admin.html           # Admin dashboard
├── api/
│   ├── book.js          # Booking submission endpoint
│   ├── firebase.js      # Firebase utilities
│   └── admin/
│       └── bookings.js  # Admin API (get/delete bookings)
├── package.json         # Dependencies
├── vercel.json          # Vercel deployment config
├── .env.example         # Environment variable template
└── FIREBASE_SETUP.md    # Firebase setup instructions
```

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd trailerbooking
npm install
```

### 2. Set Up Firebase

Follow the detailed instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

Quick summary:
1. Create Firebase project
2. Enable Firestore
3. Get service account credentials
4. Add to Vercel environment variables

### 3. Configure Environment Variables

In Vercel dashboard, add these environment variables:

**Email Configuration:**
- `EMAIL_HOST` - SMTP server (default: smtp.gmail.com)
- `EMAIL_PORT` - SMTP port (default: 587)
- `EMAIL_USER` - Your email address
- `EMAIL_PASS` - App-specific password

**Firebase Configuration:**
- `FIREBASE_SERVICE_ACCOUNT` - Complete JSON from Firebase service account

**Admin Access:**
- `ADMIN_PASSWORD` - Password for admin dashboard

See `.env.example` for details.

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
5. Receive confirmation email

### For Admins

1. Visit `https://your-domain.vercel.app/admin`
2. Log in with admin password
3. View, search, filter, and export bookings
4. Manage bookings (view details, delete)

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
  "dob": "1990-01-01",
  "reason": "Moving",
  "createdAt": "2025-10-24T12:00:00Z"
}
```

**Response:**
```json
{
  "ok": true,
  "bookingId": "abc123"
}
```

### `GET /api/admin/bookings`
Get all bookings (requires authentication)

**Headers:**
```
Authorization: Bearer <admin-password>
```

**Response:**
```json
{
  "bookings": [
    {
      "id": "abc123",
      "trailer": "Trailer 1",
      "startDate": "2025-10-25",
      ...
    }
  ]
}
```

### `DELETE /api/admin/bookings?id=<booking-id>`
Delete a booking (requires authentication)

**Headers:**
```
Authorization: Bearer <admin-password>
```

**Response:**
```json
{
  "ok": true
}
```

## Database Schema

### Firestore Collection: `bookings`

```javascript
{
  id: "auto-generated",
  trailer: "Trailer 1",
  startDate: "2025-10-25",
  endDate: "2025-10-27",
  pickupHour: 10,
  dropoffHour: 16,
  firstName: "John",
  lastName: "Doe",
  dob: "1990-01-01",
  reason: "Moving",
  createdAt: Timestamp,
  status: "confirmed"
}
```

## Email Configuration

### Gmail Setup

1. Enable 2-Step Verification in Google Account
2. Generate App-Specific Password:
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Copy the generated password
3. Use this password as `EMAIL_PASS` in environment variables

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

Visit:
- Booking form: http://localhost:3000/booking
- Admin dashboard: http://localhost:3000/admin

## Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Vercel Serverless Functions
- **Database**: Firebase Firestore
- **Email**: Nodemailer (Gmail SMTP)
- **Hosting**: Vercel

## Security

- Admin dashboard protected by password
- Firebase Admin SDK for server-side database access
- Firestore security rules prevent unauthorized access
- HTTPS enforced by Vercel
- Environment variables for sensitive credentials

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers supported

## Troubleshooting

### Bookings not saving to database
- Check Vercel logs: `vercel logs`
- Verify `FIREBASE_SERVICE_ACCOUNT` is set correctly
- Check Firestore security rules

### Email not sending
- Verify email environment variables
- Check Gmail app password is correct
- Review Vercel function logs

### Admin dashboard login fails
- Confirm `ADMIN_PASSWORD` is set in Vercel
- Clear browser cache/localStorage
- Check browser console for errors

## Future Enhancements

Potential improvements:
- Email confirmations to customers
- Booking editing/modification
- Calendar sync (iCal, Google Calendar)
- SMS notifications
- Multi-user admin roles
- Booking conflicts prevention (server-side)
- Payment integration
- Customer portal (view/cancel bookings)

## License

MIT

## Support

For issues or questions:
1. Check [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for Firebase setup
2. Review Vercel deployment logs
3. Check environment variables configuration
