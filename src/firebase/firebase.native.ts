import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

type WhereTuple = [string, FirebaseFirestoreTypes.WhereFilterOp, any];
type OrderByTuple = [string, FirebaseFirestoreTypes.OrderByDirection];
type QueryOptions = {
  where?: WhereTuple | WhereTuple[];
  orderBy?: OrderByTuple | OrderByTuple[];
  limit?: number;
};

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
  opts: QueryOptions,
) {
  let q: any = firestore().collection(col);

  if (opts.where) {
    const whereClauses = Array.isArray(opts.where[0])
      ? (opts.where as WhereTuple[])
      : [opts.where as WhereTuple];
    whereClauses.forEach((clause) => {
      q = q.where(...clause);
    });
  }

  if (opts.orderBy) {
    const orderByClauses = Array.isArray(opts.orderBy[0])
      ? (opts.orderBy as OrderByTuple[])
      : [opts.orderBy as OrderByTuple];
    orderByClauses.forEach((clause) => {
      q = q.orderBy(...clause);
    });
  }

  if (opts.limit) q = q.limit(opts.limit);

  return q.get();
}

export function onSnapshot(
  col: string,
  cb: any,
  err?: (error: unknown) => void,
  opts?: QueryOptions,
) {
  let q: any = firestore().collection(col);

  if (opts?.where) {
    const whereClauses = Array.isArray(opts.where[0])
      ? (opts.where as WhereTuple[])
      : [opts.where as WhereTuple];
    whereClauses.forEach((clause) => {
      q = q.where(...clause);
    });
  }

  if (opts?.orderBy) {
    const orderByClauses = Array.isArray(opts.orderBy[0])
      ? (opts.orderBy as OrderByTuple[])
      : [opts.orderBy as OrderByTuple];
    orderByClauses.forEach((clause) => {
      q = q.orderBy(...clause);
    });
  }

  if (opts?.limit) {
    q = q.limit(opts.limit);
  }

  return q.onSnapshot(cb, err);
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
