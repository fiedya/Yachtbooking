import auth from "@react-native-firebase/auth";

export function onAuthStateChanged(callback: (user: any | null) => void) {
  return auth().onAuthStateChanged(callback);
}

export async function signInWithPhone(phoneNumber: string) {
  return auth().signInWithPhoneNumber(phoneNumber);
}

export async function confirmCode(confirmation: any, code: string) {
  return confirmation.confirm(code);
}

export function signOut() {
  return auth().signOut();
}
