import { DutyOfficer } from "@/src/entities/duty";
import { subscribeToDutyOfficers } from "@/src/services/dutyService";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";

export default function DutyOfficersScreen() {
  const { user } = useAuth();
  const [officers, setOfficers] = useState<DutyOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDutyOfficers(
      (data) => { setOfficers(data); setLoading(false); },
      (err) => { console.error("[DUTY OFFICERS]", err); setLoading(false); },
    );
    return unsub;
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return officers;
    return officers.filter(
      (o) => o.name.toLowerCase().includes(q) || o.phone?.toLowerCase().includes(q),
    );
  }, [officers, search]);

  return (
    <View style={theme.screen}>
      <View style={{ padding: 12 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Szukaj dyżurnego..."
          placeholderTextColor={colors.textSecondary}
          style={[theme.input, theme.inputDefaultText, { marginBottom: 0 }]}
        />
      </View>

      {loading ? (
        <Text style={[theme.textSecondary, { textAlign: "center", marginTop: 24 }]}>Ładowanie…</Text>
      ) : filtered.length === 0 ? (
        <Text style={[theme.textSecondary, { textAlign: "center", marginTop: 24 }]}>Brak dyżurnych</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 12, paddingTop: 0 }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.backgroundSoft,
                borderRadius: 10,
                padding: 14,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.white, fontWeight: "700", fontSize: 16 }}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.textPrimary, { fontWeight: "600" }]}>{item.name}</Text>
                {item.phone ? (
                  <Text style={[theme.textSecondary, { fontSize: 13 }]}>📞 {item.phone}</Text>
                ) : (
                  <Text style={[theme.textSecondary, { fontSize: 13 }]}>Brak numeru</Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
