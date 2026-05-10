import type { FirebaseOptions } from "firebase/app";

function req(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name];
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(
      `Missing ${String(name)}. Copy .env.example to .env.local and fill Firebase Web config (Vite only exposes VITE_*).`,
    );
  }
  return v.trim();
}

/** Web client config from Vite env — never put secrets here; protect data with Firestore Rules. */
export function readFirebaseWebConfig(): FirebaseOptions {
  return {
    apiKey: req("VITE_FIREBASE_API_KEY"),
    authDomain: req("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: req("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: req("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: req("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: req("VITE_FIREBASE_APP_ID"),
  };
}
