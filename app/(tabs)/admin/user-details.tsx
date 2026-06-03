import { Permission, PermissionGroup } from "@/src/entities/permissionGroup";
import { UserStatus } from "@/src/entities/user";
import { getUserStatusLabel } from "@/src/helpers/enumHelper";
import { useAuth } from "@/src/providers/AuthProvider";
import { subscribeToAllPermissionGroups } from "@/src/services/permissionGroupService";
import {
  subscribeToUser,
  updateUserPermissionGroups,
  updateUserStatus,
} from "@/src/services/userService";
import { usePermissions } from "@/src/providers/PermissionsProvider";
import { useMode } from "@/src/providers/ModeProvider";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

type UserDetails = {
  uid: string;
  name: string;
  surname: string;
  phone: string;
  status: UserStatus;
  permissionGroups?: string[];
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
      <Text style={theme.textSecondary}>{label}</Text>
      <Text style={[theme.textPrimary, { fontWeight: "500" }]}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  let bg = colors.lightGrey;
  let fg = colors.textSecondary;
  if (status === UserStatus.Verified) { bg = colors.secondary; fg = colors.white; }
  if (status === UserStatus.Rejected) { bg = colors.dangerSoft; fg = colors.danger; }

  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, alignSelf: "flex-start" }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: fg }}>{getUserStatusLabel(status)}</Text>
    </View>
  );
}

export default function UserDetailsScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { uid: adminUid } = useAuth();
  const router = useRouter();
  const { mode } = useMode();
  const { can } = usePermissions();
  const canVerifyUsers = mode === "admin" || can(Permission.VerifyUsers);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [allGroups, setAllGroups] = useState<PermissionGroup[]>([]);
  const [allGroupsLoaded, setAllGroupsLoaded] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [savingGroups, setSavingGroups] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToUser(uid, (u) => {
      if (!u) return;
      setUser(u);
      setSelectedGroupIds(new Set(u.permissionGroups ?? []));
    });
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!adminUid) return;
    return subscribeToAllPermissionGroups(
      (data) => { setAllGroups(data); setAllGroupsLoaded(true); },
      (err) => { console.error("[USER DETAILS] permissionGroups error", err); setAllGroupsLoaded(true); },
    );
  }, [adminUid]);

  const groupsDirty = useMemo(() => {
    const current = new Set(user?.permissionGroups ?? []);
    if (current.size !== selectedGroupIds.size) return true;
    for (const id of selectedGroupIds) if (!current.has(id)) return true;
    return false;
  }, [selectedGroupIds, user?.permissionGroups]);

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  }

  async function handleSaveGroups() {
    if (!user) return;
    if (!allGroupsLoaded) {
      console.warn("[USER DETAILS] Grupy uprawnień jeszcze nie załadowane, anulowano zapis");
      return;
    }
    setSavingGroups(true);
    try {
      const groupIdArray = Array.from(selectedGroupIds);
      // Spłaszcz uprawnienia ze wszystkich wybranych grup (bez duplikatów)
      const effectivePermissions = [
        ...new Set(
          groupIdArray.flatMap(
            (id) => allGroups.find((g) => g.id === id)?.permissions ?? [],
          ),
        ),
      ];
      console.log("[USER DETAILS] Zapis grup:", groupIdArray, "effectivePermissions:", effectivePermissions);
      await updateUserPermissionGroups(user.uid, groupIdArray, effectivePermissions);
    } finally {
      setSavingGroups(false);
    }
  }

  if (!user) {
    return (
      <View style={[theme.screenPadded, theme.center]}>
        <Text style={theme.textMuted}>Ładowanie…</Text>
      </View>
    );
  }

  async function handleVerify() {
    if (!user) return;
    setUpdating(true);
    try {
      await updateUserStatus(user.uid, UserStatus.Verified);
      router.back();
    } finally {
      setUpdating(false);
    }
  }

  async function handleReject() {
    if (!user) return;
    const reason = rejectionReason.trim();
    if (!reason) return;
    setUpdating(true);
    try {
      await updateUserStatus(user.uid, UserStatus.Rejected, {
        reason,
        adminUid: adminUid || "",
      });
      router.back();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <ScrollView style={theme.screen} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      {/* User info card */}
      <View style={{ backgroundColor: colors.backgroundSoft, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <InfoRow label="Imię" value={user.name} />
        <InfoRow label="Nazwisko" value={user.surname} />
        {!!user.phone && <InfoRow label="Telefon" value={user.phone} />}
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
          <Text style={theme.textSecondary}>Status</Text>
          <StatusBadge status={user.status} />
        </View>
      </View>

      {canVerifyUsers && user.status !== UserStatus.Verified && (
        <Pressable
          style={[theme.button, { marginBottom: 12, opacity: updating ? 0.5 : 1 }]}
          onPress={handleVerify}
          disabled={updating}
        >
          <Text style={theme.buttonText}>Przyjmij</Text>
        </Pressable>
      )}

      {canVerifyUsers && user.status !== UserStatus.Rejected && !showRejectInput && (
        <Pressable
          style={[theme.button, theme.buttonDanger]}
          onPress={() => { setRejectionReason(""); setShowRejectInput(true); }}
        >
          <Text style={theme.buttonText}>Odrzuć</Text>
        </Pressable>
      )}

      {canVerifyUsers && showRejectInput && (
        <View style={[theme.card, theme.cardPadding, { marginTop: 8 }]}>
          <Text style={[theme.sectionTitle, { marginBottom: 8 }]}>Podaj powód odrzucenia</Text>
          <TextInput
            value={rejectionReason}
            onChangeText={setRejectionReason}
            placeholder="Wpisz powód odrzucenia..."
            placeholderTextColor={colors.textSecondary}
            style={[theme.input, theme.inputDefaultText, { minHeight: 80 }]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            autoFocus
          />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <Pressable
              style={[theme.button, theme.buttonDanger, { flex: 1, opacity: updating || !rejectionReason.trim() ? 0.5 : 1 }]}
              onPress={handleReject}
              disabled={updating || !rejectionReason.trim()}
            >
              <Text style={theme.buttonText}>
                {updating ? "Zapisywanie..." : "Potwierdź odrzucenie"}
              </Text>
            </Pressable>
            <Pressable
              style={[theme.button, { flex: 1 }]}
              onPress={() => setShowRejectInput(false)}
              disabled={updating}
            >
              <Text style={theme.buttonText}>Anuluj</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Grupy uprawnień */}
      <View style={{ marginTop: 28 }}>
        <Text style={[theme.sectionTitle, { marginBottom: 12 }]}>Grupy uprawnień</Text>
        {!allGroupsLoaded ? (
          <Text style={theme.textMuted}>Ładowanie grup…</Text>
        ) : allGroups.length === 0 ? (
          <Text style={theme.textMuted}>Brak zdefiniowanych grup. Utwórz je w sekcji "Grupy uprawnień".</Text>
        ) : (
          allGroups.map((group) => {
            const active = selectedGroupIds.has(group.id);
            return (
              <Pressable
                key={group.id}
                onPress={() => toggleGroup(group.id)}
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
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: active ? colors.primary : colors.lightGrey,
                    backgroundColor: active ? colors.primary : colors.white,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[theme.textPrimary, { fontWeight: active ? "600" : "400" }]}>
                    {group.name}
                  </Text>
                  <Text style={theme.textMuted}>
                    {group.permissions.length === 0 ? "Brak uprawnień" : `${group.permissions.length} uprawnie${group.permissions.length === 1 ? "nie" : group.permissions.length < 5 ? "nia" : "ń"}`}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}

        {groupsDirty && allGroupsLoaded && (
          <Pressable
            onPress={handleSaveGroups}
            disabled={savingGroups}
            style={[theme.button, { marginTop: 12 }, savingGroups && theme.buttonDisabled]}
          >
            <Text style={theme.buttonText}>{savingGroups ? "Zapisuję..." : "Zapisz grupy"}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
