import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin SDK
const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const userEmail = 'charant923@gmail.com';
const newPassword = '123!@#';

async function resetPassword() {
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(userEmail);
    // Update password
    await admin.auth().updateUser(userRecord.uid, { password: newPassword });
    console.log(`Password for ${userEmail} has been reset successfully.`);
  } catch (error) {
    console.error('Error resetting password:', error);
  }
}

resetPassword(); 