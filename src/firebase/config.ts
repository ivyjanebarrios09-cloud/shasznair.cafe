import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Helper function to validate databaseId from localStorage or config.
// Returns undefined if databaseId is '(default)', 'default', or empty.
export const validateDatabaseId = (idFromStorage?: string | null): string | undefined => {
  try {
    const rawId = idFromStorage !== undefined 
      ? idFromStorage 
      : (typeof localStorage !== 'undefined' ? localStorage.getItem('coffee_selected_db_id') : null);
    if (!rawId) return undefined;
    const trimmed = rawId.trim();
    if (trimmed === '' || trimmed === '(default)' || trimmed === 'default') {
      return undefined;
    }
    return trimmed;
  } catch (e) {
    return undefined;
  }
};

// Helper function to get Firestore instance securely.
export const getSafeFirestoreInstance = (appInstance: any, dbId?: string) => {
  const validDbId = validateDatabaseId(dbId);
  if (validDbId) {
    return getFirestore(appInstance, validDbId);
  }
  return getFirestore(appInstance);
};

// Get databaseId from config, env, or localStorage override
const getInitialDatabaseId = () => {
  const configId = (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId;
  const validated = validateDatabaseId() || validateDatabaseId(configId);
  return validated || '(default)';
};

const databaseId = getInitialDatabaseId();
const validDbIdForFirestore = validateDatabaseId(databaseId);

let db: any;
try {
  if (validDbIdForFirestore) {
    db = initializeFirestore(app, { localCache: memoryLocalCache() }, validDbIdForFirestore);
  } else {
    db = initializeFirestore(app, { localCache: memoryLocalCache() });
  }
} catch (e) {
  try {
    if (validDbIdForFirestore) {
      db = getFirestore(app, validDbIdForFirestore);
    } else {
      db = getFirestore(app);
    }
  } catch (e2) {
    db = getFirestore(app);
  }
}

const auth = getAuth(app);

export { app, db, auth, databaseId };


