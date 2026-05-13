import { UserStatus } from "@/src/entities/user";
import { getUserStatusLabel } from "@/src/helpers/enumHelper";
import { useAuth } from "@/src/providers/AuthProvider";
import { subscribeToUser, updateUserStatus } from "@/src/services/userService";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type UserDetails = {
  uid: string;
  name: string;
  surname: string;
  phone: string;
  status: UserStatus;
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
  const [user, setUser] = useState<UserDetails | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToUser(uid, (user) => {
      if (!user) return;
      setUser(user);
    });
    return unsub;
  }, [uid]);

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
    <View style={theme.screenPadded}>
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

      {user.status !== UserStatus.Verified && (
        <Pressable
          style={[theme.button, { marginBottom: 12, opacity: updating ? 0.5 : 1 }]}
          onPress={handleVerify}
          disabled={updating}
        >
          <Text style={theme.buttonText}>Przyjmij</Text>
        </Pressable>
      )}

      {user.status !== UserStatus.Rejected && !showRejectInput && (
        <Pressable
          style={[theme.button, theme.buttonDanger]}
          onPress={() => { setRejectionReason(""); setShowRejectInput(true); }}
        >
          <Text style={theme.buttonText}>Odrzuć</Text>
        </Pressable>
      )}

      {showRejectInput && (
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
    </View>
  );
}
