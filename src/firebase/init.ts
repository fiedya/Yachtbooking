import { Platform } from "react-native";

import * as native from "./firebase.native";
import * as web from "./firebase.web";

const impl = Platform.OS === "web" ? web : native;

export const {
  onAuthStateChanged,
  getCurrentUser,
  signOut,
  sendCode,
  confirmCode,
  initRecaptcha,
  getDoc,
  setDoc,
  updateDoc,
  queryDocs,
  onSnapshot,
  serverTimestamp,
  addDocAuto,
  onDocSnapshot,
} = impl;
