# Managing Bookings

This system uses a **manual booking management** approach where confirmed bookings are hardcoded in the `booking.html` file.

## How to Add a New Booking

When a customer completes a Stripe payment, follow these steps:

### 1. Get Booking Details from Email

You'll receive an email with:
- Trailer name
- Start date
- End date
- Pickup time (hour)
- Dropoff time (hour)
- Customer name

### 2. Edit booking.html

Open `booking.html` and find the `CONFIRMED_BOOKINGS` array (around line 208).

### 3. Add the Booking

Add a new entry to the array:

```javascript
const CONFIRMED_BOOKINGS = [
  {
    trailer: "8.5 x 20 Car Hauler",
    startDate: "2025-11-28",
    endDate: "2025-11-28",
    pickupHour: 12,
    dropoffHour: 15,
    note: "Existing booking"
  },
  // ADD NEW BOOKING HERE:
  {
    trailer: "6 x 12 Cargo Trailer",
    startDate: "2025-12-05",
    endDate: "2025-12-07",
    pickupHour: 9,
    dropoffHour: 17,
    note: "John Doe - Paid"
  }
];
```

### 4. Trailer Names (must match exactly)

- `"5 x 10 Utility Trailer"`
- `"6 x 12 Cargo Trailer"`
- `"8.5 x 20 Car Hauler"`
- `"7 x 20 Utility Trailer"`
- `"7 x 16 Utility Pipe Trailer"`
- `"7 x 16 Utility Ramp Trailer"`

### 5. Date Format

- Use `"YYYY-MM-DD"` format
- Example: `"2025-12-25"` for December 25, 2025

### 6. Time Format (Hours)

- Use 24-hour format numbers (6-18)
- 6 = 6:00 AM
- 12 = 12:00 PM (noon)
- 18 = 6:00 PM

### 7. Commit and Deploy

After adding the booking:

```bash
git add booking.html
git commit -m "Add booking: [Trailer] for [Customer] on [Date]"
git push
```

Vercel will automatically deploy the changes.

## Example: Adding a Multi-Day Booking

Customer books **7 x 20 Utility Trailer** from **Dec 10-15, 2025, 8am-5pm**:

```javascript
{
  trailer: "7 x 20 Utility Trailer",
  startDate: "2025-12-10",
  endDate: "2025-12-15",
  pickupHour: 8,
  dropoffHour: 17,
  note: "Sarah Smith - 6 days"
}
```

## Example: Adding a Same-Day Booking

Customer books **5 x 10 Utility Trailer** on **Nov 30, 2025, 10am-2pm**:

```javascript
{
  trailer: "5 x 10 Utility Trailer",
  startDate: "2025-11-30",
  endDate: "2025-11-30",
  pickupHour: 10,
  dropoffHour: 14,
  note: "Mike Johnson - 4 hours"
}
```

## How It Works

1. When the page loads, `CONFIRMED_BOOKINGS` are loaded into the calendar
2. Times for booked periods are automatically greyed out
3. Customers cannot select conflicting times
4. All visitors see the same unavailable times

## Removing Old Bookings

To keep the file clean, remove bookings after they're completed:

```javascript
const CONFIRMED_BOOKINGS = [
  // Remove this after Nov 28:
  // {
  //   trailer: "8.5 x 20 Car Hauler",
  //   startDate: "2025-11-28",
  //   endDate: "2025-11-28",
  //   pickupHour: 12,
  //   dropoffHour: 15,
  //   note: "Completed"
  // },

  // Keep current and future bookings
  {
    trailer: "6 x 12 Cargo Trailer",
    startDate: "2025-12-05",
    endDate: "2025-12-07",
    pickupHour: 9,
    dropoffHour: 17,
    note: "John Doe - Active"
  }
];
```

## Tips

- ✅ Always use the exact trailer name from the list
- ✅ Use YYYY-MM-DD date format
- ✅ Add a note with customer name for reference
- ✅ Remove past bookings monthly to keep the file clean
- ✅ Test on the live site after deploying

## Need Help?

Ask Claude to add the booking for you by providing:
- Trailer name
- Dates
- Times
- Customer name (optional)
