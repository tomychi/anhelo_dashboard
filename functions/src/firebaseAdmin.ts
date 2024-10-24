// firebaseAdmin.ts
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const firestore = admin.firestore();
export default admin;
