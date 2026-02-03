import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

/* AUTH */
export const onAuthStateChanged = (cb: any) =>
  auth().onAuthStateChanged(cb);

export const getCurrentUser = () => auth().currentUser;

export const signOut = () => auth().signOut();

export const sendCode = (phone: string) =>
  auth().signInWithPhoneNumber(phone);

export const confirmCode = (c: any, code: string) =>
  c.confirm(code);

export const initRecaptcha = undefined;

/* FIRESTORE */
export const serverTimestamp =
  firestore.FieldValue.serverTimestamp;

export function getDoc(col: string, id: string) {
  return firestore().collection(col).doc(id).get();
}

export function setDoc(col: string, id: string, data: any, opts?: any) {
  return firestore().collection(col).doc(id).set(data, opts);
}

export function updateDoc(col: string, id: string, data: any) {
  return firestore().collection(col).doc(id).update(data);
}

export function queryDocs(
  col: string,
  opts: { where?: any; orderBy?: any; limit?: number },
) {
  let q: any = firestore().collection(col);

  if (opts.where) q = q.where(...opts.where);
  if (opts.orderBy) q = q.orderBy(...opts.orderBy);
  if (opts.limit) q = q.limit(opts.limit);

  return q.get();
}

export function onSnapshot(col: string, cb: any) {
  return firestore().collection(col).onSnapshot(cb);
}

export function addDocAuto(col: string, data: any) {
  return firestore().collection(col).add(data);
}

export function onDocSnapshot(
  collection: string,
  id: string,
  cb: (snap: any) => void,
  err?: (error: unknown) => void,
) {
  return firestore()
    .collection(collection)
    .doc(id)
    .onSnapshot(cb, err);
}
