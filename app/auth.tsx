import { styles as theme } from "@/src/theme/styles";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";


declare global {
  interface Window {
    recaptchaVerifier?: any;
  }
}

export default function AuthScreen() {
  const router = useRouter();
  const confirmationRef = useRef<any>(null);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* --------------------------------
     SEND SMS CODE
  ---------------------------------- */
  async function handleSendCode() {
    setError(null);
    setLoading(true);

    try {
      let confirmation;

      if (Platform.OS === "web") {
        // 🔹 Firebase Web SDK
        const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } =
          require("firebase/auth");
        const { getApp } = require("firebase/app");

        const auth = getAuth(getApp());

        // 🔐 Init reCAPTCHA ON DEMAND (NOT in useEffect)
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
            },
          );

          await window.recaptchaVerifier.render();
        }

        confirmation = await signInWithPhoneNumber(
          auth,
          phone,
          window.recaptchaVerifier,
        );
      } else {
        // 📱 Native
        const authNative =
          require("@react-native-firebase/auth").default;

        confirmation = await authNative().signInWithPhoneNumber(phone);
      }

      confirmationRef.current = confirmation;
      setStep("code");
    } catch (e: any) {
      console.error("[PHONE AUTH ERROR]", e);
      setError(e?.message || "Nie udało się wysłać kodu");
    } finally {
      setLoading(false);
    }
  }

  /* --------------------------------
     CONFIRM SMS CODE
  ---------------------------------- */
  async function handleConfirmCode() {
    const confirmation = confirmationRef.current;
    if (!confirmation) {
      setError("Sesja wygasła");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await confirmation.confirm(code);
      router.replace("/post-auth");
    } catch (e) {
      console.error("[CODE CONFIRM ERROR]", e);
      setError("Kod nieprawidłowy");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 🔐 REQUIRED for Firebase Web Phone Auth */}
      {Platform.OS === "web" && (
        <div
          id="recaptcha-container"
          style={{ position: "absolute", bottom: 0 }}
        />
      )}

      <View style={theme.screenPadded}>
        <Image
          source={require("@/assets/images/logo_transparent.png")}
          style={{
            width: "70%",
            height: "20%",
            resizeMode: "contain",
            alignSelf: "center",
            marginBottom: "10%",
            marginTop: "30%",
          }}
        />

        {step === "phone" ? (
          <>
            <Text style={[theme.title, { marginVertical: "10%" }]}>
              Numer telefonu
            </Text>

            <TextInput
              placeholder=""
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={theme.input}
            />

            <Pressable
              style={[theme.button, { marginVertical: "10%" }]}
              onPress={handleSendCode}
              disabled={loading || phone.length < 6}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={theme.buttonText}>Wyślij kod</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[theme.title, { marginVertical: "10%" }]}>
              Kod SMS
            </Text>

            <TextInput
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              style={theme.input}
            />

            <Pressable
              style={[theme.button, { marginVertical: "10%" }]}
              onPress={handleConfirmCode}
              disabled={loading || code.length < 4}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={theme.buttonText}>Zaloguj</Text>
              )}
            </Pressable>
          </>
        )}

        {error && <Text style={theme.textMuted}>{error}</Text>}
      </View>
    </>
  );
}
