import Icon from "@/src/components/Icon";
import { Duty } from "@/src/entities/duty";
import { subscribeToWeekDuties } from "@/src/services/dutyService";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

function formatDateTime(ts: any): string {
  const d = ts?.toDate?.();
  if (!d) return "–";
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function durationLabel(duty: Duty): string {
  const s = duty.start?.toDate?.();
  const e = duty.end?.toDate?.();
  if (!s || !e) return "";
  const minutes = Math.round((e.getTime() - s.getTime()) / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "min" : ""}`.trim() : `${m}min`;
}

// Fetch duties from a very wide range covering past and future
const RANGE_START = new Date(2000, 0, 1);
const RANGE_END = new Date(2100, 0, 1);

export default function AllDutiesScreen() {
  const { user } = useAuth();
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToWeekDuties(
      RANGE_START,
      RANGE_END,
      (data) => { setDuties(data); setLoading(false); },
      (err) => { console.error("[ALL DUTIES]", err); setLoading(false); },
    );
    return unsub;
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? duties.filter(
          (d) =>
            d.dutyOfficerName.toLowerCase().includes(q) ||
            d.dutyOfficerPhone?.toLowerCase().includes(q),
        )
      : duties;
    return [...list].sort((a, b) => {
      const aTime = a.start?.toDate?.()?.getTime?.() ?? 0;
      const bTime = b.start?.toDate?.()?.getTime?.() ?? 0;
      return bTime - aTime;
    });
  }, [duties, search]);

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
        <Text style={[theme.textSecondary, { textAlign: "center", marginTop: 24 }]}>Brak dyżurów</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 12, paddingTop: 0 }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.backgroundSoft,
                borderRadius: 10,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={[theme.textPrimary, { fontWeight: "600", flex: 1 }]}>
                  {item.dutyOfficerName}
                </Text>
                <Text style={[theme.textSecondary, { fontSize: 12 }]}>{durationLabel(item)}</Text>
              </View>
              {item.dutyOfficerPhone ? (
                <Text style={[theme.textSecondary, { fontSize: 13, marginTop: 2 }]}>
                  📞 {item.dutyOfficerPhone}
                </Text>
              ) : null}
              <Text style={[theme.textSecondary, { fontSize: 12, marginTop: 4 }]}>
                {formatDateTime(item.start)} – {formatDateTime(item.end)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
