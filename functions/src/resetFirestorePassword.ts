import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';

// Initialize Firebase Admin SDK
const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const userEmail = 'charant923@gmail.com';
const newPassword = '123!@#';

async function resetFirestorePassword() {
  try {
    // Find user document by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', userEmail).get();

    if (snapshot.empty) {
      console.log('No user found with that email.');
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password field for each matching user (should be only one)
    for (const doc of snapshot.docs) {
      await doc.ref.update({ password: hashedPassword });
      console.log(`Password updated for user: ${userEmail}`);
    }
  } catch (error) {
    console.error('Error updating password:', error);
  }
}

resetFirestorePassword(); 