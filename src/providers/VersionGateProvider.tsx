import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";
import {
  compareVersions,
  getMinRequiredVersion,
  subscribeToVersionControl,
} from "@/src/services/versionService";

const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.syc.yachtbooking";

export function VersionGateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [minVersion, setMinVersion] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const unsub = subscribeToVersionControl(
      (data) => {
        const min = getMinRequiredVersion(data.forcedVersions ?? []);
        setMinVersion(min);
        setBlocked(!!min && compareVersions(APP_VERSION, min) < 0);
      },
      (err) => console.warn("[VERSION GATE]", err),
    );
    return unsub;
  }, []);

  if (blocked && minVersion) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
          backgroundColor: "#fff",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            marginBottom: 12,
            textAlign: "center",
            color: "#111",
          }}
        >
          Wymagana aktualizacja
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#555",
            textAlign: "center",
            marginBottom: 6,
            lineHeight: 22,
          }}
        >
          Twoja wersja aplikacji ({APP_VERSION}) jest przestarzała i nie jest
          już obsługiwana.
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#555",
            textAlign: "center",
            marginBottom: 36,
          }}
        >
          Wymagana wersja: <Text style={{ fontWeight: "700" }}>{minVersion}</Text>
        </Text>
        <Pressable
          onPress={() => Linking.openURL(PLAY_STORE_URL)}
          style={{
            backgroundColor: "#1a73e8",
            borderRadius: 10,
            paddingHorizontal: 36,
            paddingVertical: 14,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Zaktualizuj w Google Play
          </Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}
