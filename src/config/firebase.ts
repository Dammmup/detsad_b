import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK initialized');
} else {
    console.warn('⚠️ Firebase service account file not found. FCM notifications will not be available.');
}

export const messaging = fs.existsSync(serviceAccountPath) ? admin.messaging() : null;
export default admin;
