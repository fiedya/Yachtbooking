import { confirmCode, initRecaptcha, sendCode } from "@/src/firebase/init";

export { initRecaptcha };

export async function signInWithPhone(phoneNumber: string) {
  return sendCode(phoneNumber);
}

export async function signInWithPhoneWeb(phoneNumber: string) {
  return sendCode(phoneNumber);
}

export async function confirmSmsCode(confirmation: any, code: string) {
  return confirmCode(confirmation, code);
}