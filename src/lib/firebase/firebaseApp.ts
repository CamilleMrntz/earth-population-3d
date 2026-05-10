import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

import { readFirebaseWebConfig } from "./readFirebaseWebConfig";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

/** Singleton Firebase app (lazy). */
export function getFirebaseApp(): FirebaseApp {
  if (!app) app = initializeApp(readFirebaseWebConfig());
  return app;
}

/** Firestore database for this project (lazy). */
export function getFirestoreDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}
