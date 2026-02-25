import { useTheme } from "@/src/providers/ThemeContext";
import { createStyles } from "@/src/theme/styles";

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
  const { colors } = useTheme();
  const theme = createStyles(colors);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [pseudonim, setPseudonim] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, uid, loading: authLoading } = useAuth();
  const router = useRouter();

  const validatePseudonim = (text: string): boolean => {
    if (!text.trim()) return true; // Optional field
    // Allow only alphanumeric characters (a-z, A-Z, 0-9)
    return /^[a-zA-Z0-9]+$/.test(text);
  };

  const handlePseudonimChange = (text: string) => {
    if (validatePseudonim(text)) {
      setPseudonim(text);
    }
  };

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
        pseudonim.trim() || undefined,
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

          <Text style={theme.label}>Pseudonim (opcjonalnie):</Text>
          <TextInput
            placeholder="Tylko litery i cyfry"
            value={pseudonim}
            onChangeText={handlePseudonimChange}
            style={[theme.input, theme.inputDefaultText, { marginBottom: 16 }]}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            maxLength={20}
          />
        </View>

        <Pressable
          style={[theme.submit, (!name || !surname) && theme.submitDisabled]}
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
