import { signInWithPhone } from "@/src/services/authService";
import { styles as theme } from "@/src/theme/styles";
import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AuthScreen() {
  const router = useRouter();

  const confirmationRef = useRef<any>(null);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function log(label: string, data?: any) {
    const t = new Date().toISOString().split("T")[1];
  }

  async function handleSendCode() {
    log("SEND CODE pressed", { phone });

    setError(null);
    setLoading(true);

    try {
      log("Calling signInWithPhone");
      const confirmation = await signInWithPhone(phone);

      log("SMS SENT", {
        confirmationType: typeof confirmation,
        hasConfirmMethod: !!confirmation?.confirm,
      });

      confirmationRef.current = confirmation;
      setStep("code");
    } catch (e: any) {
      log("SEND CODE ERROR", {
        code: e?.code,
        message: e?.message,
        raw: e,
      });
      setError(e.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCode() {
    const confirmation = confirmationRef.current;

    if (!confirmation) {
      log("NO confirmation object");
      setError("Session expired");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const start = Date.now();
      await confirmation.confirm(code);
      const duration = Date.now() - start;
      const user = auth().currentUser;

      router.replace("/post-auth");
    } catch (e: any) {
      log("CONFIRM ERROR", {
        code: e?.code,
        message: e?.message,
        raw: e,
      });
      setError("Kod nieprawidłowy");
    } finally {
      setLoading(false);
    }
  }

  return (
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
            placeholder="+48123456789"
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
          <Text style={[theme.title, { marginVertical: "10%" }]}>Kod SMS</Text>
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
  );
}
