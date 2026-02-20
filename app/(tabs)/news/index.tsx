import Icon from "@/src/components/Icon";
import { News } from "@/src/entities/news";
import { useAuth } from "@/src/providers/AuthProvider";
import { subscribeToNews } from "@/src/services/newsService";
import { subscribeToUser } from "@/src/services/userService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useMode } from "../../../src/providers/ModeProvider";

export default function NewsScreen() {
  const { mode } = useMode();
  const [isAdmin, setIsAdmin] = useState(false);
  const [news, setNews] = useState<News[]>([]);
  const { user, uid, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (profile) => {
      setIsAdmin(profile?.role === "admin" && mode === "admin");
    });
    return unsub;
  }, [mode]);

  useEffect(() => {
    const unsub = subscribeToNews((allNews) => {
      setNews(
        allNews.sort(
          (a, b) =>
            (b.createdAt?.toDate?.() ?? 0) - (a.createdAt?.toDate?.() ?? 0),
        ),
      );
    });
    return unsub;
  }, []);

  function truncate(text: string, maxLength: number) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  }

  return (
    <View style={theme.screenPadded}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Informacje",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
        }}
      />

      <FlatList
        data={news}
        keyExtractor={(item, index) =>
          item.id ? String(item.id) : String(index)
        }
        contentContainerStyle={theme.listPadding}
        renderItem={({ item }) => (
          <Pressable
            style={[
              theme.card,
              {
                backgroundColor: colors.lightGrey,
                borderColor: colors.primary,
                borderWidth: 1,
                padding: 10,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/news/news-details",
                params: { id: item.id },
              })
            }
          >
            <Text style={theme.cardTitle}>{item.title}</Text>
            <Text style={theme.label}>{truncate(item.description, 100)}</Text>
          </Pressable>
        )}
      />

      {isAdmin && (
        <Pressable
          onPress={() => router.push("/news/add-news")}
          style={{
            position: "absolute",
            right: 20,
            bottom: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            elevation: 4,
          }}
        >
          <Icon name="add" size={28} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}
