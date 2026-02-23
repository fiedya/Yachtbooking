import { UserStatus } from "@/src/entities/user";
import { getUserStatusLabel } from "@/src/helpers/enumHelper";
import { subscribeToUser, updateUserStatus } from "@/src/services/userService";
import { styles as theme } from "@/src/theme/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";

type UserDetails = {
  uid: string;
  name: string;
  surname: string;
  phone: string;
  status: UserStatus;
};

export default function UserDetailsScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetails | null>(null);

  useEffect(() => {
    if (!uid) return;

    const unsub = subscribeToUser(uid, (user) => {
      if (!user) return;
      setUser(user);
    });

    return unsub;
  }, [uid]);


  if (!user) {
    return (
      <View style={[theme.screenPadded, theme.center]}>
        <Text style={theme.textMuted}>Loading user…</Text>
      </View>
    );
  }

  async function updateStatus(
    nextStatus: UserStatus.Verified | UserStatus.Rejected,
  ) {
    const message = `Na pewno chcesz oznaczyć tego użytkownika nowym statusem: ${getUserStatusLabel(nextStatus)}?`;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(message);
      if (!confirmed || !user) return;
      await updateUserStatus(user.uid, nextStatus);
      router.back();
      return;
    }

    Alert.alert("Potwierdź", message, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Potwierdź",
        style: "destructive",
        onPress: async () => {
          if (!user) return;

          await updateUserStatus(user.uid, nextStatus);
          router.back();
        },
      },
    ]);
  }


  return (
    <View style={theme.screenPadded}>
      <Text style={theme.title}>
        {user.name} {user.surname}
      </Text>

      <Text style={theme.textSecondary}>{user.phone}</Text>

      <View style={{ marginVertical: 24 }}>
        <Text style={theme.textMuted}>Current status</Text>
        <Text style={theme.textPrimary}>
          {getUserStatusLabel(user.status)}
        </Text>
      </View>

      {user.status !== UserStatus.Verified && (
        <Pressable
          style={[theme.button, { marginBottom: 12 }]}
          onPress={() => updateStatus(UserStatus.Verified)}
        >
          <Text style={theme.buttonText}>Przyjmij</Text>
        </Pressable>
      )}

      {user.status !== UserStatus.Rejected && (
        <Pressable
          style={[theme.button, theme.buttonDanger]}
          onPress={() => updateStatus(UserStatus.Rejected)}
        >
          <Text style={theme.buttonText}>Odrzuć</Text>
        </Pressable>
      )}
    </View>
  );
}
