import { Yacht } from "@/src/entities/yacht";
import { getYachtStatusLabel } from "@/src/helpers/enumHelper";
import { subscribeToUser } from "@/src/services/userService";
import { getYachtById, updateYacht } from "@/src/services/yachtService";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import { MaterialIcons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMode } from "../../providers/ModeProvider";

export default function YachtDetailsScreen() {
  const { mode } = useMode();
  const [isAdmin, setIsAdmin] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [editingField, setEditingField] = useState<
    null | "shortcut" | "type" | "description"
  >(null);
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    getYachtById(id).then(setYacht);
  }, [id]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (profile) => {
      setIsAdmin(profile?.role === "admin" && mode === "admin");
    });
    return unsub;
  }, [mode]);

  const startEdit = (field: "shortcut" | "type" | "description") => {
    setEditingField(field);
    setFieldValue(yacht?.[field] || "");
  };

  const saveField = async (field: "shortcut" | "type" | "description") => {
    if (!id || typeof id !== "string") return;
    setSaving(true);
    try {
      await updateYacht(id, { [field]: fieldValue });
      setYacht((y) => (y ? { ...y, [field]: fieldValue } : y));
      setEditingField(null);
    } catch (e) {
      // Optionally show error
      console.error("Save yacht field error", e);
    } finally {
      setSaving(false);
    }
  };

  if (!yacht) {
    return (
      <View style={theme.screen}>
        <Text style={theme.textMuted}>Ładowanie…</Text>
      </View>
    );
  }

  return (
    <View style={theme.screen}>
      <Stack.Screen
        options={{
          title: yacht.name,
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
          headerBackVisible: true,
        }}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: "100%",
            height: 240,
          }}
        >
          <Image
            source={
              yacht.imageUrl
                ? { uri: yacht.imageUrl }
                : require("@/assets/images/yacht_placeholder.png")
            }
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>

        {/* 📄 Content */}
        <View style={[theme.screenPadded, { height: "100%" }]}>
          {/* Shortcut */}
          <View style={{ marginVertical: 10 }}>
            <Text style={theme.sectionTitle}>Skrót</Text>
            {editingField === "shortcut" && isAdmin ? (
              <View style={{ gap: 8 }}>
                <TextInput
                  value={fieldValue}
                  onChangeText={setFieldValue}
                  style={theme.input}
                  placeholder="Wpisz skrót"
                  autoFocus
                />
                <Pressable
                  style={{
                    backgroundColor: theme.link.color,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 4,
                    alignSelf: "flex-start",
                    opacity: saving ? 0.5 : 1,
                  }}
                  onPress={() => saveField("shortcut")}
                  disabled={saving}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
                  >
                    {saving ? "Zapisywanie..." : "Zapisz"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onPress={isAdmin ? () => startEdit("shortcut") : undefined}
                disabled={!isAdmin}
              >
                <Text style={[theme.bodyText, { flex: 1 }]}>
                  {yacht.shortcut && yacht.shortcut.trim() !== ""
                    ? yacht.shortcut
                    : "Brak skrótu"}
                </Text>
                {isAdmin && (
                  <MaterialIcons
                    name="edit"
                    size={18}
                    color={theme.link.color}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Pressable>
            )}
          </View>

          {/* Type */}
          <View style={{ marginBottom: 10 }}>
            <Text style={theme.sectionTitle}>Typ</Text>
            {editingField === "type" && isAdmin ? (
              <View style={{ gap: 8 }}>
                <TextInput
                  value={fieldValue}
                  onChangeText={setFieldValue}
                  style={theme.input}
                  placeholder="Wpisz typ"
                  autoFocus
                />
                <Pressable
                  style={{
                    backgroundColor: theme.link.color,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 4,
                    alignSelf: "flex-start",
                    opacity: saving ? 0.5 : 1,
                  }}
                  onPress={() => saveField("type")}
                  disabled={saving}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
                  >
                    {saving ? "Zapisywanie..." : "Zapisz"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onPress={isAdmin ? () => startEdit("type") : undefined}
                disabled={!isAdmin}
              >
                <Text style={[theme.bodyText, { flex: 1 }]}>
                  {yacht.type || "Brak typu"}
                </Text>
                {isAdmin && (
                  <MaterialIcons
                    name="edit"
                    size={18}
                    color={theme.link.color}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Pressable>
            )}
          </View>

          {/* Description & Status */}
          <View>
            <Text style={theme.sectionTitle}>Opis</Text>
            {editingField === "description" && isAdmin ? (
              <View style={{ gap: 8 }}>
                <TextInput
                  value={fieldValue}
                  onChangeText={setFieldValue}
                  style={[theme.input, { minHeight: 80 }]}
                  placeholder="Wpisz opis"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus
                />
                <Pressable
                  style={{
                    backgroundColor: theme.link.color,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 4,
                    alignSelf: "flex-start",
                    opacity: saving ? 0.5 : 1,
                  }}
                  onPress={() => saveField("description")}
                  disabled={saving}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
                  >
                    {saving ? "Zapisywanie..." : "Zapisz"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onPress={isAdmin ? () => startEdit("description") : undefined}
                disabled={!isAdmin}
              >
                <View style={{ flex: 1 }}>
                  <Text style={theme.bodyText}>
                    {yacht.description || "Brak opisu"}
                  </Text>
                  <Text
                    style={[theme.bodyText, { marginTop: 8, color: "#666" }]}
                  >
                    Status: {getYachtStatusLabel(yacht.status)}
                  </Text>
                </View>
                {isAdmin && (
                  <MaterialIcons
                    name="edit"
                    size={18}
                    color={theme.link.color}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
