import { Platform } from "react-native";

/* ------------------------------------------------------------------ */
/*  Native (react-native-firebase)                                     */
/* ------------------------------------------------------------------ */
let nativeAuth: any = null;

/* ------------------------------------------------------------------ */
/*  Web (firebase js sdk)                                              */
/* ------------------------------------------------------------------ */
let webAuth: any = null;
let RecaptchaVerifier: any = null;
let signInWithPhoneNumber: any = null;
let webApp: any = null;

if (Platform.OS === "web") {
  const appMod = require("firebase/app");
  const authMod = require("firebase/auth");

  const firebaseConfig = {
    apiKey: "AIzaSyAYhQebgwtkMD35Zpb-mjyMZ5D_4wxURys",
    authDomain: "yachtbooking-34dce.firebaseapp.com",
    projectId: "yachtbooking-34dce",
    storageBucket: "yachtbooking-34dce.firebasestorage.app",
    messagingSenderId: "878201914009",
    appId: "1:878201914009:web:f59983b820b7370eb8ae08",
    measurementId: "G-THHDMW3LFP"
  };
  webApp =
    appMod.getApps().length === 0
      ? appMod.initializeApp(firebaseConfig)
      : appMod.getApp();

  webAuth = authMod.getAuth(webApp);
  RecaptchaVerifier = authMod.RecaptchaVerifier;
  signInWithPhoneNumber = authMod.signInWithPhoneNumber;
} else {
  nativeAuth = require("@react-native-firebase/auth").default();
}

/* ------------------------------------------------------------------ */
/*  Unified exports                                                    */
/* ------------------------------------------------------------------ */

export const auth = Platform.OS === "web" ? webAuth : nativeAuth;

/* ---------------- Phone Auth ---------------- */

let recaptcha: any = null;

export function initRecaptcha(containerId = "recaptcha-container") {
  if (Platform.OS !== "web") return;

  if (!recaptcha) {
    recaptcha = new RecaptchaVerifier(
      auth,
      containerId,
      { size: "invisible" }
    );
    recaptcha.render();
  }
}

export async function signInWithPhone(phone: string) {
  if (Platform.OS === "web") {
    if (!recaptcha) {
      throw new Error("reCAPTCHA not initialized");
    }
    return signInWithPhoneNumber(auth, phone, recaptcha);
  }
  return auth.signInWithPhoneNumber(phone);
}
