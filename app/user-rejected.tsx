import { UserStatus } from "@/src/entities/user";
import { useAuth } from "@/src/providers/AuthProvider";
import { signOut } from "@/src/firebase/init";
import { getUser, subscribeToUser } from "@/src/services/userService";
import { styles as theme } from "@/src/theme/styles";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function UserRejectedScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);

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

      if (profile.status === UserStatus.ToVerify) {
        router.replace("/wait-for-verification");
        return;
      }

      if (profile.status === UserStatus.Verified) {
        router.replace("/post-auth");
        return;
      }

      setRejectionReason(profile.rejectionReason ?? null);

      if (profile.rejectedByAdminUid) {
        try {
          const adminData = await getUser(profile.rejectedByAdminUid);
          setAdminPhone(adminData?.phone ?? null);
        } catch {
          // ignore
        }
      }
    });

    return unsubscribe;
  }, [user?.uid, router]);

  async function handleLogout() {
    try {
      await signOut();
      router.replace("/auth");
    } catch (e) {
      console.error("Logout error", e);
    }
  }

  return (
    <View style={[theme.screenPadded, theme.center]}>
      <Text style={theme.title}>Konto odrzucone</Text>

      <Text
        style={[
          theme.textSecondary,
          { textAlign: "center", marginVertical: 16 },
        ]}
      >
        Twoje konto zostało odrzucone przez administratora.
      </Text>

      {rejectionReason ? (
        <View style={[theme.card, theme.cardPadding, { width: "100%", marginVertical: 8 }]}>
          <Text style={theme.sectionTitle}>Powód odrzucenia</Text>
          <Text style={theme.textPrimary}>{rejectionReason}</Text>
        </View>
      ) : null}

      {adminPhone ? (
        <Text style={[theme.textSecondary, { textAlign: "center", marginTop: 16 }]}>
          Skontaktuj się z administratorem: {adminPhone}
        </Text>
      ) : null}

      <Pressable
        style={[theme.button, theme.buttonDanger, { marginTop: 32 }]}
        onPress={handleLogout}
      >
        <Text style={theme.buttonDangerText}>Wyloguj się</Text>
      </Pressable>
    </View>
  );
}
