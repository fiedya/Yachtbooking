import { Platform } from "react-native";

let impl: any;

if (Platform.OS === "web") {
  impl = require("./firebase.web");
} else {
  impl = require("./firebase.native");
}

/* AUTH */
export const onAuthStateChanged = impl.onAuthStateChanged;
export const getCurrentUser = impl.getCurrentUser;
export const signOut = impl.signOut;
export const sendCode = impl.sendCode;
export const confirmCode = impl.confirmCode;
export const initRecaptcha = impl.initRecaptcha;

/* FIRESTORE */
export const getDoc = impl.getDoc;
export const setDoc = impl.setDoc;
export const updateDoc = impl.updateDoc;
export const queryDocs = impl.queryDocs;
export const onSnapshot = impl.onSnapshot;
export const serverTimestamp = impl.serverTimestamp;
export const addDocAuto = impl.addDocAuto;
export const onDocSnapshot = impl.onDocSnapshot;
