import Constants from "expo-constants";
import Icon from "@/src/components/Icon";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  VersionControl,
  compareVersions,
  getMinRequiredVersion,
  saveVersionControl,
  subscribeToVersionControl,
} from "@/src/services/versionService";

const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";

export default function VersionControlScreen() {
  const [data, setData] = useState<VersionControl | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newVersion, setNewVersion] = useState("");

  useEffect(() => {
    const unsub = subscribeToVersionControl(
      (d) => { setData(d); setLoading(false); },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const minRequired = data ? getMinRequiredVersion(data.forcedVersions) : null;
  const isCurrentBlocked =
    !!minRequired && compareVersions(APP_VERSION, minRequired) < 0;

  async function handleAddVersion() {
    const v = newVersion.trim();
    if (!v) return;
    if (!/^\d+\.\d+\.\d+$/.test(v)) {
      Alert.alert("Błędny format", "Wpisz wersję w formacie X.Y.Z, np. 0.4.1");
      return;
    }
    if (!data) return;
    if (data.forcedVersions.includes(v)) {
      Alert.alert("Już istnieje", "Ta wersja jest już oznaczona jako wymuszona.");
      return;
    }
    setSaving(true);
    try {
      await saveVersionControl({
        ...data,
        forcedVersions: [...data.forcedVersions, v],
      });
      setNewVersion("");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveVersion(v: string) {
    if (!data) return;
    Alert.alert(
      "Usuń wymuszoną wersję",
      `Czy na pewno usunąć ${v} z listy wymuszeń?`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await saveVersionControl({
                ...data,
                forcedVersions: data.forcedVersions.filter((x) => x !== v),
              });
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Kontrola wersji",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
        }}
      />

      {/* Info card */}
      <View style={{ backgroundColor: colors.backgroundSoft, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <Row label="Wersja tej aplikacji" value={APP_VERSION} />
        <Row
          label="Min. wymagana wersja"
          value={minRequired ?? "brak (bez wymuszeń)"}
          highlight={!!minRequired}
        />
        {isCurrentBlocked && (
          <Text style={{ color: colors.danger, marginTop: 8, fontSize: 13 }}>
            ⚠ Ta wersja aplikacji byłaby zablokowana obecnymi ustawieniami.
          </Text>
        )}
      </View>

      {/* Forced versions list */}
      <Text style={[theme.sectionTitle, { marginBottom: 10 }]}>Wymuszone wersje</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : !data || data.forcedVersions.length === 0 ? (
        <Text style={[theme.textMuted, { marginBottom: 16 }]}>
          Brak. Wszyscy użytkownicy mogą używać dowolnej wersji.
        </Text>
      ) : (
        [...data.forcedVersions]
          .sort(compareVersions)
          .reverse()
          .map((v) => {
            const isMin = v === minRequired;
            return (
              <View
                key={v}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isMin ? "#eef3ff" : colors.backgroundSoft,
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 8,
                  borderWidth: isMin ? 1.5 : 0,
                  borderColor: isMin ? colors.primary : "transparent",
                }}
              >
                <Text style={[theme.textPrimary, { flex: 1, fontWeight: isMin ? "700" : "400" }]}>
                  {v}{isMin ? "  ← aktywna granica" : ""}
                </Text>
                <Pressable
                  onPress={() => handleRemoveVersion(v)}
                  disabled={saving}
                  style={{ padding: 4 }}
                >
                  <Icon name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            );
          })
      )}

      {/* Add new */}
      <Text style={[theme.sectionTitle, { marginTop: 8, marginBottom: 10 }]}>
        Dodaj wymuszoną wersję
      </Text>
      <Text style={[theme.textMuted, { marginBottom: 12, fontSize: 13, lineHeight: 18 }]}>
        Użytkownicy z wersją starszą niż największa z listy będą zmuszeni zaktualizować
        aplikację przed dalszym użyciem.
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={newVersion}
          onChangeText={setNewVersion}
          placeholder="np. 0.4.1"
          placeholderTextColor={colors.textSecondary}
          style={[theme.input, theme.inputDefaultText, { flex: 1 }]}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
        />
        <Pressable
          onPress={handleAddVersion}
          disabled={saving || !newVersion.trim()}
          style={{
            backgroundColor: saving || !newVersion.trim() ? colors.lightGrey : colors.primary,
            borderRadius: 8,
            paddingHorizontal: 16,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.white, fontWeight: "600" }}>Dodaj</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.textSecondary }}>{label}</Text>
      <Text style={{ color: highlight ? colors.primary : colors.textPrimary, fontWeight: highlight ? "700" : "500" }}>
        {value}
      </Text>
    </View>
  );
}
