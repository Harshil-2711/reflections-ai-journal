import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  Firestore,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { JournalEntry } from "../types";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Initialize Firestore with custom database ID if available
export const db: Firestore = firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Zero-Crash Payload Hygiene: Utility to recursively strip all undefined values
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (value === undefined) {
        return null;
      }
      return value;
    })
  );
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// User-Isolated Firestore Database Operations
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error("Authentication required to save entry.");
  
  const sanitizedEntry = sanitizeForFirestore({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });

  const entryRef = doc(db, "users", userId, "journals", entry.id);
  await setDoc(entryRef, sanitizedEntry, { merge: true });
}

export async function fetchUserJournals(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];
  
  const journalsRef = collection(db, "users", userId, "journals");
  const q = query(journalsRef, orderBy("updatedAt", "desc"));
  const querySnapshot = await getDocs(q);

  const entries: JournalEntry[] = [];
  querySnapshot.forEach((docSnap) => {
    if (docSnap.exists()) {
      entries.push(docSnap.data() as JournalEntry);
    }
  });

  return entries;
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId) throw new Error("Authentication required to delete entry.");
  const entryRef = doc(db, "users", userId, "journals", entryId);
  await deleteDoc(entryRef);
}
