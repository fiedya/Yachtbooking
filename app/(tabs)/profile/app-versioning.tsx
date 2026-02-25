import { useTheme } from "@/src/providers/ThemeContext";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type VersionNote = {
  version: string;
  date: string;
  notes: string;
};

export default function AppVersioningScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [versions, setVersions] = useState<VersionNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await import("../../../src/app-versioning.json");
        const arr = data.default || data;
        setVersions(Array.isArray(arr) ? [...arr].reverse() : []);
      } catch (e) {
        setError("Nie udało się załadować listy wersji.");
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: "Historia wersji" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.currentVersion}>
          Aktualna wersja: {Constants.expoConfig?.version}
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {versions.map((v, idx) => {
          // Remove (aktualna) if present for comparison
          const cleanVersion = v.version.replace(/\s*\(aktualna\)/, "");
          const isCurrent = cleanVersion === Constants.expoConfig?.version;
          return (
            <View
              key={v.version}
              style={[
                styles.card,
                isCurrent && { borderWidth: 2, borderColor: colors.secondary },
              ]}
            >
              <Text style={styles.version}>
                v{v.version} <Text style={styles.date}>({v.date})</Text>
              </Text>
              {Array.isArray(v.notes) ? (
                <View style={styles.notesList}>
                  {v.notes.map((note: string, i: number) => (
                    <Text key={i} style={styles.noteItem}>
                      • {note}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.noteItem}>{v.notes}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: colors.primary,
  },
  currentVersion: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    shadowColor: colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  version: {
    fontWeight: "bold",
    fontSize: 16,
    color: colors.primary,
    marginBottom: 2,
  },
  date: {
    fontWeight: "normal",
    fontSize: 13,
    color: colors.textMuted,
  },
  notesList: {
    marginTop: 4,
    marginLeft: 8,
  },
  noteItem: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  error: {
    color: colors.danger,
    marginBottom: 10,
  },
});
