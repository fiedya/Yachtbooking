import { UserStatus } from "@/src/entities/user";
import { getUserStatusLabel } from "@/src/helpers/enumHelper";
import { subscribeToUsersToVerify } from "@/src/services/userService";
import { styles as theme } from "@/src/theme/styles";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

type UserRow = {
  uid: string;
  name: string;
  surname: string;
  phone: string;
  status: UserStatus;
};

const getStatusLabel = getUserStatusLabel;

function getStatusPillStyle(status: UserStatus) {
  if (status === UserStatus.Verified) return theme.pillInvisible;
  if (status === UserStatus.ToVerify) return theme.pillSecondary;
  if (status === UserStatus.Rejected) return theme.pillActive;
  return theme.pill;
}

export default function UsersToVerifyScreen() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);

    const unsub = subscribeToUsersToVerify(
      (users) => {
        setUsers(users);
        setLoading(false);
      },
      (error) => {
        console.error(
          "[USERS TO VERIFY] snapshot error:",
          error,
        );
        setLoading(false);
      },
    );

    return unsub;
  }, []);

  return (
    <View style={theme.screen}>
      <FlatList
        contentContainerStyle={theme.listPadding}
        data={users}
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
                <View>
                  <Text style={theme.textPrimary}>
                    {item.name} {item.surname}
                  </Text>
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
            <Text style={theme.textMuted}>No users to verify</Text>
          ) : null
        }
      />
    </View>
  );
}
