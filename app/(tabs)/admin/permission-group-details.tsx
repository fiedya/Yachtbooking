import Icon from "@/src/components/Icon";
import {
  Permission,
  PermissionGroup,
  PermissionLabels,
} from "@/src/entities/permissionGroup";
import {
  deletePermissionGroup,
  subscribeToAllPermissionGroups,
  updatePermissionGroup,
} from "@/src/services/permissionGroupService";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const ALL_PERMISSIONS = Object.values(Permission);

export default function PermissionGroupDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<Permission>>(new Set());
  const [saving, setSaving] = useState(false);

  const group = useMemo(() => groups.find((g) => g.id === id) ?? null, [groups, id]);

  useEffect(() => {
    const unsub = subscribeToAllPermissionGroups((g) => {
      setGroups(g);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!group) return;
    setName(group.name);
    setSelectedPerms(new Set(group.permissions));
  }, [group?.id]);

  function togglePerm(perm: Permission) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updatePermissionGroup(id, {
        name: name.trim(),
        permissions: Array.from(selectedPerms),
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      "Usuń grupę",
      `Czy na pewno chcesz usunąć grupę "${group?.name}"? Użytkownicy z tą grupą stracą powiązane uprawnienia.`,
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            await deletePermissionGroup(id);
            router.back();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={[theme.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[theme.screen, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={theme.textMuted}>Nie znaleziono grupy.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      {/* Nazwa */}
      <Text style={[theme.label, { marginBottom: 4 }]}>Nazwa grupy</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={[theme.input, theme.inputDefaultText, { marginBottom: 24 }]}
        placeholderTextColor={colors.textMuted}
        placeholder="Nazwa grupy"
      />

      {/* Uprawnienia */}
      <Text style={[theme.sectionTitle, { marginBottom: 12 }]}>Uprawnienia</Text>
      {ALL_PERMISSIONS.map((perm) => {
        const active = selectedPerms.has(perm);
        return (
          <Pressable
            key={perm}
            onPress={() => togglePerm(perm)}
            style={[
              theme.card,
              {
                padding: 14,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? "#eef3ff" : colors.white,
              },
            ]}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: active ? colors.primary : colors.lightGrey,
                backgroundColor: active ? colors.primary : colors.white,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {active && <Icon name="checkmark" size={14} color={colors.white} />}
            </View>
            <Text style={[theme.textPrimary, { flex: 1 }]}>{PermissionLabels[perm]}</Text>
          </Pressable>
        );
      })}

      {/* Zapisz */}
      <Pressable
        onPress={handleSave}
        disabled={saving || !name.trim()}
        style={[
          theme.button,
          { marginTop: 24 },
          (saving || !name.trim()) && theme.buttonDisabled,
        ]}
      >
        <Text style={theme.buttonText}>{saving ? "Zapisuję..." : "Zapisz zmiany"}</Text>
      </Pressable>

      {/* Usuń */}
      <Pressable
        onPress={handleDelete}
        style={[
          theme.button,
          { marginTop: 12, backgroundColor: colors.white, borderWidth: 1.5, borderColor: "#cc0000" },
        ]}
      >
        <Text style={[theme.buttonText, { color: "#cc0000" }]}>Usuń grupę</Text>
      </Pressable>
    </ScrollView>
  );
}
