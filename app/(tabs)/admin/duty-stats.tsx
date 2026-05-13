import WebDatePicker from "@/src/components/WebDatePicker";
import Icon from "@/src/components/Icon";
import { Duty } from "@/src/entities/duty";
import { getDutiesInRange } from "@/src/services/dutyService";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";

/* ----------------------------------
   Season helpers
----------------------------------- */

function getDefaultSeason(): { from: Date; to: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  if (month >= 8) {
    return {
      from: new Date(year, 8, 1, 0, 0, 0, 0),
      to: new Date(year + 1, 7, 31, 23, 59, 59, 999),
    };
  }
  return {
    from: new Date(year - 1, 8, 1, 0, 0, 0, 0),
    to: new Date(year, 7, 31, 23, 59, 59, 999),
  };
}

function minutesInRange(duty: Duty, from: Date, to: Date): number {
  const s = duty.start?.toDate?.();
  const e = duty.end?.toDate?.();
  if (!s || !e) return 0;
  const clippedStart = Math.max(s.getTime(), from.getTime());
  const clippedEnd = Math.min(e.getTime(), to.getTime());
  if (clippedEnd <= clippedStart) return 0;
  return Math.round((clippedEnd - clippedStart) / 60000);
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ----------------------------------
   Stats row type
----------------------------------- */

type StatsRow = {
  name: string;
  minutes: number;
  percent: number;
};

/* ----------------------------------
   Screen
----------------------------------- */

export default function DutyStatsScreen() {
  const isFocused = useIsFocused();
  const isWeb = Platform.OS === "web";

  const defaultSeason = useMemo(() => getDefaultSeason(), []);
  const [from, setFrom] = useState<Date>(defaultSeason.from);
  const [to, setTo] = useState<Date>(defaultSeason.to);

  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const fetchIdRef = useRef(0);

  async function fetchDuties() {
    setLoading(true);
    const id = ++fetchIdRef.current;
    try {
      const rangeEnd = new Date(to);
      rangeEnd.setHours(23, 59, 59, 999);
      const data = await getDutiesInRange(from, rangeEnd);
      if (id !== fetchIdRef.current) return;
      setDuties(data);
    } catch (err) {
      console.error("[DUTY STATS]", err);
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }

  // Fetch once on first focus
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (isFocused && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchDuties();
    }
  }, [isFocused]);

  const stats = useMemo<StatsRow[]>(() => {
    const rangeEnd = new Date(to);
    rangeEnd.setHours(23, 59, 59, 999);

    const byOfficer: Record<string, number> = {};
    for (const duty of duties) {
      const mins = minutesInRange(duty, from, rangeEnd);
      if (mins <= 0) continue;
      const name = duty.dutyOfficerName || "Nieznany";
      byOfficer[name] = (byOfficer[name] ?? 0) + mins;
    }

    const total = Object.values(byOfficer).reduce((s, v) => s + v, 0);
    if (total === 0) return [];

    return Object.entries(byOfficer)
      .map(([name, minutes]) => ({
        name,
        minutes,
        percent: Math.round((minutes / total) * 100),
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [duties, from, to]);

  const maxMinutes = stats[0]?.minutes ?? 1;

  return (
    <View style={theme.screen}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Date range pickers */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={[theme.textSecondary, { fontSize: 12, marginBottom: 4 }]}>Od</Text>
            {isWeb ? (
              <WebDatePicker mode="date" value={from} onChange={setFrom} placeholder="YYYY-MM-DD" />
            ) : (
              <>
                <Pressable
                  onPress={() => setShowFromPicker(true)}
                  style={[theme.input, { paddingVertical: 10 }]}
                >
                  <Text style={theme.inputDefaultText}>{formatDate(from)}</Text>
                </Pressable>
                {showFromPicker && (
                  <DateTimePicker
                    value={from}
                    mode="date"
                    onChange={(_, d) => { setShowFromPicker(false); if (d) setFrom(d); }}
                  />
                )}
              </>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[theme.textSecondary, { fontSize: 12, marginBottom: 4 }]}>Do</Text>
            {isWeb ? (
              <WebDatePicker mode="date" value={to} onChange={setTo} placeholder="YYYY-MM-DD" />
            ) : (
              <>
                <Pressable
                  onPress={() => setShowToPicker(true)}
                  style={[theme.input, { paddingVertical: 10 }]}
                >
                  <Text style={theme.inputDefaultText}>{formatDate(to)}</Text>
                </Pressable>
                {showToPicker && (
                  <DateTimePicker
                    value={to}
                    mode="date"
                    onChange={(_, d) => { setShowToPicker(false); if (d) setTo(d); }}
                  />
                )}
              </>
            )}
          </View>

          <Pressable
            onPress={fetchDuties}
            style={{
              marginTop: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="refresh-outline" size={20} color={colors.white} />
          </Pressable>
        </View>

        {/* Chart */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
        ) : stats.length === 0 ? (
          <Text style={[theme.textSecondary, { textAlign: "center", marginTop: 32 }]}>
            Brak dyżurów w wybranym okresie
          </Text>
        ) : (
          <View>
            <Text style={[theme.textPrimary, { fontWeight: "700", marginBottom: 16, fontSize: 15 }]}>
              Dyżury: {formatDate(from)} – {formatDate(to)}
            </Text>
            {stats.map((row) => (
              <View key={row.name} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={[theme.textPrimary, { fontWeight: "600", flex: 1 }]} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text style={[theme.textSecondary, { fontSize: 13, marginLeft: 8 }]}>
                    {row.percent}% · {formatHours(row.minutes)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 18,
                    backgroundColor: colors.lightGrey,
                    borderRadius: 9,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${(row.minutes / maxMinutes) * 100}%`,
                      backgroundColor: colors.primaryLight,
                      borderRadius: 9,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
