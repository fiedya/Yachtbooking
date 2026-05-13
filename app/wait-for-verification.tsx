import { UserStatus } from "@/src/entities/user";
import { useAuth } from "@/src/providers/AuthProvider";
import { sendLocalNotification } from "@/src/services/notificationService";
import { subscribeToUser } from "@/src/services/userService";
import { styles as theme } from "@/src/theme/styles";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function WaitForVerificationScreen() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.uid) {
      router.replace("/auth");
      return;
    }

    const unsubscribe = subscribeToUser(user.uid, async (profile) => {
      if (!profile) {
        router.replace("/auth");
        return;
      }

      if (profile.status === UserStatus.Verified) {
        await sendLocalNotification(
          "Konto zaakceptowane",
          "Twoje konto zostało zaakceptowane. Możesz teraz korzystać z aplikacji.",
        );
        router.replace("/post-auth");
      } else if (profile.status === UserStatus.Rejected) {
        await sendLocalNotification(
          "Konto odrzucone",
          "Twoje konto zostało odrzucone przez administratora.",
        );
        router.replace("/user-rejected");
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
