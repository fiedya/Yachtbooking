import Icon from "@/src/components/Icon";
import { Yacht, YachtStatus } from "@/src/entities/yacht";
import { getYachtStatusLabel } from "@/src/helpers/enumHelper";
import { uploadImage } from "@/src/services/imageUploadService";
import { getYachtById, updateYacht } from "@/src/services/yachtService";
import { pickImageFromGallery } from "@/src/utils/pickImage";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
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
import { Permission } from "@/src/entities/permissionGroup";
import { usePermissions } from "@/src/providers/PermissionsProvider";
import { useMode } from "../../../src/providers/ModeProvider";

const yachtStatuses: YachtStatus[] = [
  YachtStatus.Available,
  YachtStatus.Maintenance,
  YachtStatus.Disabled,
  YachtStatus.NotOurs,
];

function YachtStatusBadge({ status }: { status: YachtStatus }) {
  const label = getYachtStatusLabel(status);
  let bg = colors.lightGrey;
  let fg = colors.textSecondary;
  if (status === YachtStatus.Available) { bg = colors.secondary; fg = colors.white; }
  if (status === YachtStatus.Maintenance) { bg = "#FFF3CD"; fg = "#856404"; }
  if (status === YachtStatus.Disabled) { bg = colors.dangerSoft; fg = colors.danger; }
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, alignSelf: "flex-start" }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: fg }}>{label}</Text>
    </View>
  );
}

function EditableRow({
  label,
  value,
  fieldKey,
  editingField,
  fieldValue,
  saving,
  isAdmin,
  multiline,
  onStartEdit,
  onChangeText,
  onSave,
  onCancel,
  placeholder,
}: {
  label: string;
  value: string;
  fieldKey: string;
  editingField: string | null;
  fieldValue: string;
  saving: boolean;
  isAdmin: boolean;
  multiline?: boolean;
  onStartEdit: () => void;
  onChangeText: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder: string;
}) {
  const isEditing = editingField === fieldKey;
  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: isEditing ? 8 : 0 }}>
        <Text style={theme.textSecondary}>{label}</Text>
        {isAdmin && !isEditing && (
          <Pressable onPress={onStartEdit}>
            <Icon type="material" name="edit" size={18} color={colors.primary} />
          </Pressable>
        )}
      </View>
      {isEditing ? (
        <View style={{ gap: 8 }}>
          <TextInput
            value={fieldValue}
            onChangeText={onChangeText}
            style={[theme.input, theme.inputDefaultText, multiline && { minHeight: 80 }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            textAlignVertical={multiline ? "top" : "center"}
            autoFocus
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              style={[theme.button, { flex: 1, paddingVertical: 8, opacity: saving ? 0.5 : 1 }]}
              onPress={onSave}
              disabled={saving}
            >
              <Text style={theme.buttonText}>{saving ? "Zapisywanie..." : "Zapisz"}</Text>
            </Pressable>
            <Pressable
              style={[theme.button, { flex: 1, paddingVertical: 8, backgroundColor: colors.lightGrey }]}
              onPress={onCancel}
              disabled={saving}
            >
              <Text style={[theme.buttonText, { color: colors.textPrimary }]}>Anuluj</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={[theme.textPrimary, { marginTop: 2 }]}>
          {value && value.trim() !== "" ? value : <Text style={theme.textMuted}>{placeholder}</Text>}
        </Text>
      )}
    </View>
  );
}

export default function YachtDetailsScreen() {
  const { mode } = useMode();
  const isAdmin = mode === "admin";
  const { can } = usePermissions();
  const canEditYacht = isAdmin || can(Permission.EditYacht);
  const canChangeStatus = isAdmin || can(Permission.ChangeYachtStatus);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [editingField, setEditingField] = useState<null | "shortcut" | "type" | "description">(null);
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    getYachtById(id).then(setYacht);
  }, [id]);

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
      console.error("Save yacht field error", e);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    if (!id || typeof id !== "string") return;
    const localUri = await pickImageFromGallery();
    if (!localUri) return;
    setSaving(true);
    try {
      const url = await uploadImage(localUri, `yachts/${id}/main.jpg`);
      await updateYacht(id, { imageUrl: url });
      setYacht((y) => (y ? { ...y, imageUrl: url } : y));
    } catch (e) {
      console.error("Change yacht photo error", e);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status: YachtStatus) => {
    if (!id || typeof id !== "string") return;
    if (!canChangeStatus || !yacht || yacht.status === status) return;
    setSaving(true);
    try {
      await updateYacht(id, { status });
      setYacht((y) => (y ? { ...y, status } : y));
    } catch (e) {
      console.error("Save yacht status error", e);
    } finally {
      setSaving(false);
    }
  };

  if (!yacht) {
    return (
      <View style={[theme.screen, theme.center]}>
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

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <Pressable
          style={{ width: "100%", height: 240 }}
          onPress={canEditYacht ? handleChangePhoto : undefined}
          disabled={!canEditYacht || saving}
        >
          <Image
            source={
              yacht.imageUrl
                ? { uri: yacht.imageUrl }
                : require("@/assets/images/yacht_placeholder.png")
            }
            style={{ width: "100%", height: "100%", opacity: saving ? 0.6 : 1 }}
            resizeMode="cover"
          />
          {canEditYacht && (
            <View
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                backgroundColor: "rgba(0,0,0,0.5)",
                borderRadius: 20,
                padding: 8,
              }}
            >
              <Icon name="camera-outline" size={20} color="#fff" />
            </View>
          )}
        </Pressable>

        {/* Info card */}
        <View style={{ margin: 16, backgroundColor: colors.backgroundSoft, borderRadius: 12, padding: 16 }}>
          <EditableRow
            label="Skrót"
            value={yacht.shortcut}
            fieldKey="shortcut"
            editingField={editingField}
            fieldValue={fieldValue}
            saving={saving}
            isAdmin={canEditYacht}
            placeholder="Brak skrótu"
            onStartEdit={() => startEdit("shortcut")}
            onChangeText={setFieldValue}
            onSave={() => saveField("shortcut")}
            onCancel={() => setEditingField(null)}
          />
          <EditableRow
            label="Typ"
            value={yacht.type}
            fieldKey="type"
            editingField={editingField}
            fieldValue={fieldValue}
            saving={saving}
            isAdmin={canEditYacht}
            placeholder="Brak typu"
            onStartEdit={() => startEdit("type")}
            onChangeText={setFieldValue}
            onSave={() => saveField("type")}
            onCancel={() => setEditingField(null)}
          />
          <EditableRow
            label="Opis"
            value={yacht.description}
            fieldKey="description"
            editingField={editingField}
            fieldValue={fieldValue}
            saving={saving}
            isAdmin={canEditYacht}
            multiline
            placeholder="Brak opisu"
            onStartEdit={() => startEdit("description")}
            onChangeText={setFieldValue}
            onSave={() => saveField("description")}
            onCancel={() => setEditingField(null)}
          />

          {/* Status */}
          <View style={{ paddingVertical: 12 }}>
            <Text style={[theme.textSecondary, { marginBottom: 10 }]}>Status</Text>
            {canChangeStatus ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {yachtStatuses.map((statusValue) => {
                  const isActive = yacht.status === statusValue;
                  return (
                    <Pressable
                      key={statusValue}
                      onPress={() => changeStatus(statusValue)}
                      disabled={saving}
                      style={[
                        theme.pill,
                        isActive ? theme.pillActive : theme.pillDefault,
                        saving ? { opacity: 0.6 } : null,
                      ]}
                    >
                      <Text style={isActive ? theme.textOnPrimary : theme.textSecondary}>
                        {getYachtStatusLabel(statusValue)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <YachtStatusBadge status={yacht.status} />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
