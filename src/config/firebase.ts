import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

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
        // Try to load from local firebase-service-account.json file
        const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');

        if (fs.existsSync(serviceAccountPath)) {
            try {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });

                console.log('✅ Firebase Admin SDK initialized with service account from firebase-service-account.json');
            } catch (error) {
                console.error('❌ Failed to load Firebase service account from file:', error);
                console.warn('⚠️ FCM notifications will not be available.');
            }
        } else {
            console.warn('⚠️ No Firebase service account found in environment variables or firebase-service-account.json file. FCM notifications will not be available.');
        }
    }
}

export const messaging = admin.apps.length > 0 ? admin.messaging() : null;
export default admin;
