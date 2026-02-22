import { colors } from "@/src/theme/colors";
import { styles, styles as theme } from "@/src/theme/styles";

import { useAuth } from "@/src/providers/AuthProvider";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { createOrUpdateUser } from "../src/services/userService";

export default function OnboardingScreen() {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, uid, loading: authLoading } = useAuth();
  const router = useRouter();

  async function handleContinue() {

    if (!name.trim() || !surname.trim()) {
      return;
    }

    if (!user) return;

    setLoading(true);

    try {

      await createOrUpdateUser(
        user.uid,
        user.phoneNumber || "",
        name.trim(),
        surname.trim(),
      );
      router.replace("/post-auth");
    } catch (e) {
      console.error("[ONBOARDING] ERROR during save", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          theme.screenPadded,
          { alignContent: "center", justifyContent: "center" },
        ]}
      >
        <Text style={[theme.title, { color: colors.primary }]}>Ahoj!</Text>
        <Text style={[theme.sectionTitle, { marginBottom: 16 }]}>
          Uzupełnij swoje dane, aby kontynuować:
        </Text>

        <View>
          <Text style={theme.label}>Imię:</Text>
          <TextInput
            placeholder="Imię"
            value={name}
            onChangeText={setName}
            style={[theme.input, theme.inputDefaultText, { marginBottom: 16 }]}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />

          <Text style={theme.label}>Nazwisko:</Text>
          <TextInput
            placeholder="Nazwisko"
            value={surname}
            onChangeText={setSurname}
            style={[theme.input, theme.inputDefaultText, { marginBottom: 16 }]}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />
        </View>

        <Pressable
          style={[styles.submit, (!name || !surname) && styles.submitDisabled]}
          onPress={handleContinue}
          disabled={!name || !surname || loading}
        >
          <Text style={theme.buttonText}>
            {loading ? "Zapisywanie…" : "Kontynuuj"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
