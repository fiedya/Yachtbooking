import { UserStatus } from "@/src/entities/user";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeContext";
import { subscribeToUser } from "@/src/services/userService";
import { createStyles } from "@/src/theme/styles";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function WaitForVerificationScreen() {
  const { colors } = useTheme();
  const theme = createStyles(colors);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.uid) {
      router.replace("/auth");
      return;
    }

    const unsubscribe = subscribeToUser(user.uid, (profile) => {
      if (!profile) {
        router.replace("/auth");
        return;
      }

      if (profile.status !== UserStatus.ToVerify) {
        router.replace("/post-auth");
      }
    });

    return unsubscribe;
  }, [user?.uid, router]);

  return (
    <View style={[theme.screenPadded, theme.center]}>
      <Text style={theme.title}>Waiting for verification</Text>

      <Text
        style={[
          theme.textSecondary,
          { textAlign: "center", marginVertical: 16 },
        ]}
      >
        Twoje dane zostały wysłane do administratora. Administrator musi
        zweryfikować Twoje członkostwo, zanim będziesz mógł/a korzystać
        aplikacji.
      </Text>

      <Text style={theme.textMuted}>
        (Wróć za chwilę lub skontaktuj się ze mną.)
      </Text>
    </View>
  );
}
