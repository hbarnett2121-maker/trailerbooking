// Firebase Admin SDK configuration for server-side operations
const admin = require('firebase-admin');

let db = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variable
 */
function initializeFirebase() {
  if (db) return db;

  try {
    // Check if Firebase is already initialized
    if (!admin.apps.length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

      if (!serviceAccount) {
        console.warn('⚠️  Firebase not configured - FIREBASE_SERVICE_ACCOUNT environment variable missing');
        return null;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      console.log('✓ Firebase Admin initialized successfully');
    }

    db = admin.firestore();
    return db;
  } catch (error) {
    console.error('✗ Firebase initialization failed:', error.message);
    return null;
  }
}

/**
 * Save a booking to Firestore
 * @param {Object} booking - The booking data to save
 * @returns {Promise<Object>} The saved booking with ID
 */
async function saveBooking(booking) {
  const firestore = initializeFirebase();

  if (!firestore) {
    console.warn('⚠️  Firestore not available - skipping database save');
    return null;
  }

  try {
    const bookingData = {
      ...booking,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'confirmed'
    };

    const docRef = await firestore.collection('bookings').add(bookingData);
    console.log('✓ Booking saved to Firestore with ID:', docRef.id);

    return {
      id: docRef.id,
      ...bookingData
    };
  } catch (error) {
    console.error('✗ Failed to save booking to Firestore:', error.message);
    throw error;
  }
}

/**
 * Get all bookings from Firestore
 * @returns {Promise<Array>} Array of all bookings
 */
async function getAllBookings() {
  const firestore = initializeFirebase();

  if (!firestore) {
    throw new Error('Firestore not configured');
  }

  try {
    const snapshot = await firestore.collection('bookings')
      .orderBy('createdAt', 'desc')
      .get();

    const bookings = [];
    snapshot.forEach(doc => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return bookings;
  } catch (error) {
    console.error('✗ Failed to get bookings from Firestore:', error.message);
    throw error;
  }
}

/**
 * Delete a booking from Firestore
 * @param {string} bookingId - The ID of the booking to delete
 * @returns {Promise<void>}
 */
async function deleteBooking(bookingId) {
  const firestore = initializeFirebase();

  if (!firestore) {
    throw new Error('Firestore not configured');
  }

  try {
    await firestore.collection('bookings').doc(bookingId).delete();
    console.log('✓ Booking deleted from Firestore:', bookingId);
  } catch (error) {
    console.error('✗ Failed to delete booking from Firestore:', error.message);
    throw error;
  }
}

module.exports = {
  initializeFirebase,
  saveBooking,
  getAllBookings,
  deleteBooking
};
