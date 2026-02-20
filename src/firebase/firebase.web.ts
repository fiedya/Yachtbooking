import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  RecaptchaVerifier,
  setPersistence,
  signInWithPhoneNumber,
} from "firebase/auth";

import {
  getDoc as _getDoc,
  onSnapshot as _onSnapshot,
  setDoc as _setDoc,
  updateDoc as _updateDoc,
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  WhereFilterOp
} from "firebase/firestore";


type WhereTuple = [string, WhereFilterOp, any];
type OrderByTuple = [string, "asc" | "desc"];


/* INIT */
const firebaseConfig = {
  apiKey: "AIzaSyAYhQebgwtkMD35Zpb-mjyMZ5D_4wxURys",
  authDomain: "yachtbooking-34dce.firebaseapp.com",
  projectId: "yachtbooking-34dce",
  storageBucket: "yachtbooking-34dce.firebasestorage.app",
  messagingSenderId: "878201914009",
  appId: "1:878201914009:web:f59983b820b7370eb8ae08",
  measurementId: "G-THHDMW3LFP",
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

const auth = getAuth(app);

// 🔥 STEP 7 — Firebase Auth persistence for iOS PWA
setPersistence(auth, browserLocalPersistence).catch(() => {
  // iOS Safari private mode can throw — safe to ignore
});

const db = getFirestore(app);


/* AUTH */
export const onAuthStateChanged = (cb: any) =>
  auth.onAuthStateChanged(cb);

export const getCurrentUser = () => auth.currentUser;

export const signOut = () => auth.signOut();

let verifier: RecaptchaVerifier | null = null;

export function initRecaptcha(id = "recaptcha-container") {
  if (!verifier) {
    verifier = new RecaptchaVerifier(auth, id, { size: "invisible" });
    verifier.render();
  }
}

export const sendCode = (phone: string) => {
  if (!verifier) throw new Error("Recaptcha not initialized");
  return signInWithPhoneNumber(auth, phone, verifier);
};

export const confirmCode = (c: any, code: string) =>
  c.confirm(code);

/* FIRESTORE */
export { serverTimestamp };

export function getDoc(col: string, id: string) {
  return _getDoc(doc(db, col, id));
}

export function setDoc(col: string, id: string, data: any, opts?: any) {
  return _setDoc(doc(db, col, id), data, opts);
}

export function updateDoc(col: string, id: string, data: any) {
  return _updateDoc(doc(db, col, id), data);
}

export function queryDocs(
  col: string,
  opts: {
    where?: WhereTuple;
    orderBy?: OrderByTuple;
    limit?: number;
  },
) {
  let q: any = collection(db, col);

  if (opts.where) {
    q = query(q, where(...opts.where));
  }

  if (opts.orderBy) {
    q = query(q, orderBy(...opts.orderBy));
  }

  if (opts.limit) {
    q = query(q, limit(opts.limit));
  }

  return getDocs(q);
}


export function onSnapshot(col: string, cb: any) {
  return _onSnapshot(collection(db, col), cb);
}

export function addDocAuto(col: string, data: any) {
  return addDoc(collection(db, col), data);
}

export function onDocSnapshot(
  collection: string,
  id: string,
  cb: (snap: any) => void,
  err?: (error: unknown) => void,
) {
  return _onSnapshot(doc(db, collection, id), cb, err);
}
