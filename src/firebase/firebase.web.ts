import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
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
const app =
  getApps().length === 0
    ? initializeApp({ /* config */ })
    : getApp();

const auth = getAuth(app);
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
