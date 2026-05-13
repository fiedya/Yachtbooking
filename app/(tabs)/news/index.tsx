import Icon from "@/src/components/Icon";
import { News, NewsCategory } from "@/src/entities/news";
import { getNewsCategoryLabel } from "@/src/helpers/enumHelper";
import { subscribeToNews } from "@/src/services/newsService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useMode } from "../../../src/providers/ModeProvider";

const CATEGORY_STYLE: Record<NewsCategory, { bg: string; fg: string }> = {
  [NewsCategory.General]:  { bg: colors.primaryLight, fg: colors.primary },
  [NewsCategory.Yachts]:   { bg: colors.secondary,    fg: colors.white },
  [NewsCategory.Stanica]:  { bg: "#C8F5D5",            fg: "#1A7A3A" },
  [NewsCategory.Events]:   { bg: "#FFE4CC",            fg: "#CC5500" },
};

function CategoryBadge({ category }: { category: NewsCategory }) {
  const { bg, fg } = CATEGORY_STYLE[category] ?? { bg: colors.lightGrey, fg: colors.textSecondary };
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: fg }}>
        {getNewsCategoryLabel(category)}
      </Text>
    </View>
  );
}

function formatDate(value: any): string {
  const date = value?.toDate?.() ?? null;
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

export default function NewsScreen() {
  const { mode } = useMode();
  const isAdmin = mode === "admin";
  const [news, setNews] = useState<News[]>([]);

  useEffect(() => {
    const unsub = subscribeToNews((allNews) => {
      setNews(
        allNews.sort(
          (a, b) => (b.createdAt?.toDate?.() ?? 0) - (a.createdAt?.toDate?.() ?? 0),
        ),
      );
    });
    return unsub;
  }, []);

  return (
    <View style={theme.screen}>
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
        keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
        contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 12 }}
        ListEmptyComponent={
          <View style={[theme.center, { paddingTop: 40 }]}>
            <Text style={theme.textMuted}>Brak informacji</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={{
              backgroundColor: colors.backgroundSoft,
              borderRadius: 12,
              padding: 16,
            }}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/news/news-details",
                params: { id: item.id },
              })
            }
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <Text style={[theme.textPrimary, { fontWeight: "700", fontSize: 16, flex: 1, marginRight: 8 }]}>
                {item.title}
              </Text>
              <Icon name="chevron-forward-outline" size={18} color={colors.textMuted} />
            </View>

            {item.description ? (
              <Text style={[theme.textSecondary, { marginBottom: 10 }]}>
                {truncate(item.description, 120)}
              </Text>
            ) : null}

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <CategoryBadge category={item.category} />
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
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
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
        >
          <Icon name="add" size={28} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}
