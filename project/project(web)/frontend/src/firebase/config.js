import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || ''
};


// Check if valid Firebase configuration is supplied
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 5 &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('YOUR_')
);

let app = null;
let authInstance = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    db = getFirestore(app);
    console.log('[Firebase] Connected successfully to Firebase Cloud Services.');
  } catch (err) {
    console.warn('[Firebase] Initialization error. Running in local fallback mode:', err);
  }
} else {
  console.info('[Firebase] Config keys not detected in .env. Running with integrated in-memory / local storage persistence engine.');
}

// Fallback auth handler so auth.currentUser is always accessible as requested
const fallbackAuth = {
  get currentUser() {
    try {
      const token = localStorage.getItem('dsa_planner_token');
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const tokenUid = payload?.id || payload?.uid;
          if (tokenUid) {
            return {
              uid: tokenUid,
              id: tokenUid,
              email: payload.email,
              displayName: payload.name,
              name: payload.name
            };
          }
        }
      }

      const raw = localStorage.getItem('dsa_planner_session');
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || (!s.uid && !s.id)) return null;
      const sessionUid = s.uid || s.id;
      return {
        uid: sessionUid,
        id: sessionUid,
        email: s.email,
        displayName: s.name,
        name: s.name
      };
    } catch {
      return null;
    }
  },
  signOut: async () => {
    localStorage.removeItem('dsa_planner_session');
    localStorage.removeItem('dsa_planner_token');
    return Promise.resolve();
  }
};

const safeAuth = authInstance || fallbackAuth;

export { app, safeAuth as auth, db };
export default firebaseConfig;

