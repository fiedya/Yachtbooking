import { UserStatus } from "@/src/entities/user";
import { styles as theme } from "@/src/theme/styles";
import firestore from "@react-native-firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

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

    const unsub = firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot((doc) => {
        if (!doc.exists) return;

        const d = doc.data()!;
        setUser({
          uid: doc.id,
          name: d.name,
          surname: d.surname,
          phone: d.phone,
          status: d.status,
        });
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

  function updateStatus(nextStatus: UserStatus.Verified | UserStatus.Rejected) {
    Alert.alert(
      "Potwierdź",
      `Na pewno chcesz oznaczyć tego użytkownika nowym statusem: ${nextStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: async () => {
            await firestore()
              .collection("users")
              .doc(user?.uid)
              .update({ status: nextStatus });

            router.back();
          },
        },
      ],
    );
  }

  return (
    <View style={theme.screenPadded}>
      <Text style={theme.title}>
        {user.name} {user.surname}
      </Text>

      <Text style={theme.textSecondary}>{user.phone}</Text>

      <View style={{ marginVertical: 24 }}>
        <Text style={theme.textMuted}>Current status</Text>
        <Text style={theme.textPrimary}>{user.status}</Text>
      </View>

      {user.status !== 1 && (
        <Pressable
          style={[theme.button, { marginBottom: 12 }]}
          onPress={() => updateStatus(UserStatus.Verified)}
        >
          <Text style={theme.buttonText}>Przyjmij</Text>
        </Pressable>
      )}

      {user.status !== 2 && (
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
