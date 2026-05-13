import Icon from "@/src/components/Icon";
import { PermissionGroup } from "@/src/entities/permissionGroup";
import {
  createPermissionGroup,
  subscribeToAllPermissionGroups,
} from "@/src/services/permissionGroupService";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function PermissionGroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAllPermissionGroups((g) => {
      setGroups(g);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const id = await createPermissionGroup(name, []);
      setModalVisible(false);
      setNewName("");
      router.push({ pathname: "/(tabs)/admin/permission-group-details", params: { id } });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={theme.screen}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          contentContainerStyle={theme.listPadding}
          data={groups}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={[theme.textMuted, { textAlign: "center", marginTop: 32 }]}>
              Brak grup uprawnień
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/admin/permission-group-details",
                  params: { id: item.id },
                })
              }
            >
              <View style={[theme.card, theme.cardPadding]}>
                <View style={[theme.row, { alignItems: "center", justifyContent: "space-between" }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[theme.textPrimary, { fontWeight: "600" }]}>{item.name}</Text>
                    <Text style={theme.textMuted}>
                      {item.permissions.length === 0
                        ? "Brak uprawnień"
                        : `${item.permissions.length} uprawnienie${item.permissions.length === 1 ? "" : item.permissions.length < 5 ? "a" : "ń"}`}
                    </Text>
                  </View>
                  <Icon name="chevron-forward-outline" size={20} color={colors.textMuted} />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={{
          position: "absolute",
          bottom: 28,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          elevation: 4,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Icon name="add" size={28} color={colors.white} />
      </Pressable>

      {/* Modal: nowa grupa */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={theme.modalOverlay}>
          <View style={theme.modal}>
            <Text style={[theme.textPrimary, { fontWeight: "600", fontSize: 16, marginBottom: 12 }]}>
              Nowa grupa uprawnień
            </Text>
            <TextInput
              placeholder="Nazwa grupy"
              value={newName}
              onChangeText={setNewName}
              style={[theme.input, theme.inputDefaultText, { marginBottom: 16 }]}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={[theme.row, { gap: 10 }]}>
              <Pressable
                onPress={() => { setModalVisible(false); setNewName(""); }}
                style={[theme.button, { flex: 1, backgroundColor: colors.lightGrey }]}
              >
                <Text style={[theme.buttonText, { color: colors.textPrimary }]}>Anuluj</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={saving || !newName.trim()}
                style={[theme.button, { flex: 1 }, (!newName.trim() || saving) && theme.buttonDisabled]}
              >
                <Text style={theme.buttonText}>{saving ? "Tworzę..." : "Utwórz"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
