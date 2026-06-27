// Firebase client initialisation.
//
// Credentials are read from public env vars so the browser SDK can connect.
// Copy `.env.local.example` to `.env.local` and fill in the values from your
// Firebase project settings (Project settings -> General -> Your apps -> SDK
// setup and configuration).
//
// If the env vars are missing we expose `isFirebaseConfigured = false` and the
// rest of the app transparently falls back to local seed data, so you can boot
// the dashboard and click around without any cloud setup.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// We treat the project as "configured" only when the essential keys exist.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app = null;
let db = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { app, db };

// Name of the unified Firestore collection that holds BOTH job/internship
// cards and university requirement entries side-by-side.
export const APPLICATIONS_COLLECTION = 'applications';
