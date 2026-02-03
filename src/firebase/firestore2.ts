import { Platform } from "react-native";

let impl: any;

if (Platform.OS === "web") {
  impl = require("./firestore.web");
} else {
  impl = require("./firestore.native");
}

export const getDoc = impl.getDoc;
export const setDoc = impl.setDoc;
export const updateDoc = impl.updateDoc;
export const queryDocs = impl.queryDocs;
export const onSnapshot = impl.onSnapshot;
export const serverTimestamp = impl.serverTimestamp;
