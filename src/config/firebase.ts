import * as admin from 'firebase-admin';

// Check if Firebase Admin SDK has already been initialized
if (!admin.apps.length) {
    // Try to initialize with service account from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });

            console.log('✅ Firebase Admin SDK initialized with service account from environment');
        } catch (error) {
            console.error('❌ Failed to parse Firebase service account from environment:', error);
            console.warn('⚠️ FCM notifications will not be available.');
        }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Alternative: use GOOGLE_APPLICATION_CREDENTIALS environment variable
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });

        console.log('✅ Firebase Admin SDK initialized with application default credentials');
    } else {
        console.warn('⚠️ No Firebase service account found in environment variables. FCM notifications will not be available.');
    }
}

export const messaging = admin.apps.length > 0 ? admin.messaging() : null;
export default admin;
