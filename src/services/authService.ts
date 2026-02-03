
import {
  signInWithPhoneNumber,
} from "firebase/auth";
import { Platform } from "react-native";
import { auth } from "../firebase/auth";

/**
 * Native ONLY
 */
export async function signInWithPhone(phoneNumber: string) {
  if (Platform.OS === "web") {
    throw new Error("signInWithPhone must not be called on web");
  }

  return auth.signInWithPhoneNumber(phoneNumber);
}

/**
 * Web ONLY
 */
export async function signInWithPhoneWeb(
  phoneNumber: string,
  verifier: any,
) {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}


