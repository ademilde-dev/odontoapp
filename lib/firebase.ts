import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Safe standard client-side Firebase initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the database name specified in config
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
