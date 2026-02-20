import { UserStatus } from "@/src/entities/user";
import { getUserStatusLabel } from "@/src/helpers/enumHelper";
import { subscribeToAllUsers } from "@/src/services/userService";
import { colors } from "@/src/theme/colors";
import { styles as theme } from "@/src/theme/styles";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

type SortOption = "name" | "surname" | "pseudonim" | "createdAt";

type UserRow = {
  uid: string;
  name: string;
  surname: string;
  pseudonim: string;
  phone: string;
  status: UserStatus;
  createdAt: any;
};

const getStatusLabel = getUserStatusLabel;

function getStatusPillStyle(status: UserStatus) {
  if (status === UserStatus.Verified) return theme.pillInvisible;
  if (status === UserStatus.ToVerify) return theme.pillSecondary;
  if (status === UserStatus.Rejected) return theme.pillActive;
  return theme.pill;
}

export default function AllUsersScreen() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const router = useRouter();

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToAllUsers(
      (users) => {
        setUsers(users);
        setLoading(false);
      },
      (error) => {
        console.error("[ALL USERS] snapshot error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter by search text
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(
        (user) =>
          (user.name ?? "").toLowerCase().includes(lowerSearch) ||
          (user.surname ?? "").toLowerCase().includes(lowerSearch) ||
          (user.pseudonim ?? "").toLowerCase().includes(lowerSearch),
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name ?? "").localeCompare(b.name ?? "");
      } else if (sortBy === "surname") {
        return (a.surname ?? "").localeCompare(b.surname ?? "");
      } else if (sortBy === "pseudonim") {
        return (a.pseudonim ?? "").localeCompare(b.pseudonim ?? "");
      } else if (sortBy === "createdAt") {
        const aTime = a.createdAt?.toDate?.().getTime?.() ?? 0;
        const bTime = b.createdAt?.toDate?.().getTime?.() ?? 0;
        return bTime - aTime; // Newest first
      }
      return 0;
    });

    return result;
  }, [users, searchText, sortBy]);

  const SortButton = ({ value, label }: { value: SortOption; label: string }) => (
    <Pressable
      onPress={() => setSortBy(value)}
      style={[
        theme.pill,
        {
          paddingVertical: 6,
          paddingHorizontal: 12,
          backgroundColor: sortBy === value ? colors.primary : colors.lightGrey,
          marginRight: 8,
          marginBottom: 8,
        },
      ]}
    >
      <Text style={{ color: colors.white, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={theme.screen}>
      {/* Search input */}
      <View style={{ padding: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.lightGrey }}>
        <TextInput
          placeholder="Szukaj po imię, nazwisko, pseudonimie..."
          value={searchText}
          onChangeText={setSearchText}
          style={[
              theme.input,
            {
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: colors.lightGrey,
              borderRadius: 6,
              marginBottom: 12,
            },
          ]}
          placeholderTextColor={colors.textMuted}
        />

        {/* Sort options */}
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <SortButton value="name" label="Imię" />
          <SortButton value="surname" label="Nazwisko" />
          <SortButton value="pseudonim" label="Pseudonim" />
          <SortButton value="createdAt" label="Data" />
        </View>
      </View>

      <FlatList
        contentContainerStyle={theme.listPadding}
        data={filteredAndSortedUsers}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(tabs)/admin/user-details",
                params: { uid: item.uid },
              })
            }
          >
            <View style={[theme.card, theme.cardPadding]}>
              <View style={[theme.row, { justifyContent: "space-between" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={theme.textPrimary}>
                    {item.name} {item.surname}
                  </Text>
                  {item.pseudonim && (
                    <Text style={theme.textSecondary}>@{item.pseudonim}</Text>
                  )}
                  <Text style={theme.textMuted}>{item.phone}</Text>
                </View>

                <View style={[theme.pill, getStatusPillStyle(item.status)]}>
                  <Text style={theme.textXs}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={theme.textMuted}>
              {searchText ? "Brak użytkowników spełniających kryteria" : "Brak użytkowników"}
            </Text>
          ) : null
        }
      />
    </View>
  );
}
