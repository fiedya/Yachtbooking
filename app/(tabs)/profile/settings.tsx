import { useAuth } from "@/app/providers/AuthProvider";
import {
  subscribeToUser,
  updateUserPreferences,
} from "@/src/services/userService";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import { useEffect, useState } from "react";
import { Alert, Switch, Text, View } from "react-native";

export default function SettingsScreen() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({
    usePseudonims: false,
    useYachtShortcuts: false,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (data) => {
      setPrefs({
        usePseudonims: data?.preferences?.usePseudonims ?? false,
        useYachtShortcuts: data?.preferences?.useYachtShortcuts ?? false,
      });
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleToggle =
    (key: "usePseudonims" | "useYachtShortcuts") => async (value: boolean) => {
      setPrefs((p) => ({ ...p, [key]: value }));
      setUpdating((u) => ({ ...u, [key]: true }));
      try {
        if (user) {
          await updateUserPreferences(user.uid, { [key]: value });
        }
      } catch (e) {
        console.error("[Settings] updateUserPreferences error", e);
        setPrefs((p) => ({ ...p, [key]: !value })); // revert
        Alert.alert(
          "Błąd",
          "Nie udało się zapisać ustawienia. Spróbuj ponownie.",
        );
      } finally {
        setUpdating((u) => ({ ...u, [key]: false }));
      }
    };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text>Ładowanie…</Text>
      </View>
    );

  return (
    <View style={[theme.screenPadded, { paddingVertical: 24, flex: 1 }]}>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}
      >
        <Text style={[theme.label, { flex: 1 }]}>Używaj pseudonimów</Text>
        <Switch
          value={prefs.usePseudonims}
          onValueChange={handleToggle("usePseudonims")}
          trackColor={{ false: colors.lightGrey, true: colors.primary }}
          thumbColor={
            prefs.usePseudonims ? colors.primary : colors.primaryLight
          }
          disabled={!!updating.usePseudonims}
        />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={[theme.label, { flex: 1 }]}>Skróty jachtów</Text>
        <Switch
          value={prefs.useYachtShortcuts}
          onValueChange={handleToggle("useYachtShortcuts")}
          trackColor={{ false: colors.lightGrey, true: colors.primary }}
          thumbColor={
            prefs.useYachtShortcuts ? colors.primary : colors.primaryLight
          }
          disabled={!!updating.useYachtShortcuts}
        />
      </View>
    </View>
  );
}
