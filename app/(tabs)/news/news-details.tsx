import Icon from "@/src/components/Icon";
import { News, NewsCategory } from "@/src/entities/news";
import { getNewsCategoryLabel } from "@/src/helpers/enumHelper";
import { getNewsById, updateNews } from "@/src/services/newsService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: fg }}>
        {getNewsCategoryLabel(category)}
      </Text>
    </View>
  );
}

function formatDateTime(value: any): string {
  const date = value?.toDate?.() ?? null;
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  return date.toLocaleString("pl-PL", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function NewsDetailsScreen() {
  const { mode } = useMode();
  const isAdmin = mode === "admin";
  const { id } = useLocalSearchParams<{ id: string }>();
  const [news, setNews] = useState<News | null>(null);
  const [editingField, setEditingField] = useState<null | "title" | "description" | "category">(null);
  const [fieldValue, setFieldValue] = useState<string>("");
  const [categoryValue, setCategoryValue] = useState<NewsCategory | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    getNewsById(id).then(setNews);
  }, [id]);

  const startEdit = (field: "title" | "description" | "category") => {
    setEditingField(field);
    if (field === "category") {
      setCategoryValue(news?.category ?? null);
    } else {
      setFieldValue(news?.[field] || "");
    }
  };

  const saveField = async (field: "title" | "description" | "category") => {
    if (!id || typeof id !== "string") return;
    setSaving(true);
    try {
      if (field === "category") {
        if (categoryValue == null) return;
        await updateNews(id, { category: categoryValue });
        setNews((n) => (n ? { ...n, category: categoryValue } : n));
      } else {
        await updateNews(id, { [field]: fieldValue });
        setNews((n) => (n ? { ...n, [field]: fieldValue } : n));
      }
      setEditingField(null);
    } catch (e) {
      console.error("Save news field error", e);
    } finally {
      setSaving(false);
    }
  };

  if (!news) {
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
          title: news.title,
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
          headerBackVisible: true,
        }}
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Meta row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Pressable
            onPress={isAdmin ? () => startEdit("category") : undefined}
            disabled={!isAdmin}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <CategoryBadge category={news.category} />
              {isAdmin && <Icon type="material" name="edit" size={14} color={colors.textMuted} />}
            </View>
          </Pressable>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            {formatDateTime(news.createdAt)}
          </Text>
        </View>

        {/* Category editor */}
        {editingField === "category" && (
          <View style={{ backgroundColor: colors.backgroundSoft, borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <Text style={[theme.sectionTitle, { marginBottom: 10 }]}>Zmień kategorię</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {Object.entries(NewsCategory)
                .filter(([, v]) => typeof v === "number")
                .map(([, value]) => (
                  <Pressable
                    key={value as string}
                    onPress={() => setCategoryValue(value as NewsCategory)}
                    style={[
                      theme.pill,
                      categoryValue === value ? theme.pillActive : theme.pillDefault,
                    ]}
                  >
                    <Text style={categoryValue === value ? theme.textOnPrimary : theme.textSecondary}>
                      {getNewsCategoryLabel(value as NewsCategory)}
                    </Text>
                  </Pressable>
                ))}
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                style={[theme.button, { flex: 1, paddingVertical: 8, opacity: saving ? 0.5 : 1 }]}
                onPress={() => saveField("category")}
                disabled={saving}
              >
                <Text style={theme.buttonText}>{saving ? "Zapisywanie..." : "Zapisz"}</Text>
              </Pressable>
              <Pressable
                style={[theme.button, { flex: 1, paddingVertical: 8, backgroundColor: colors.lightGrey }]}
                onPress={() => setEditingField(null)}
              >
                <Text style={[theme.buttonText, { color: colors.textPrimary }]}>Anuluj</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Description card */}
        <View style={{ backgroundColor: colors.backgroundSoft, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={theme.sectionTitle}>Treść</Text>
            {isAdmin && editingField !== "description" && (
              <Pressable onPress={() => startEdit("description")}>
                <Icon type="material" name="edit" size={18} color={colors.primary} />
              </Pressable>
            )}
          </View>

          {editingField === "description" ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={fieldValue}
                onChangeText={setFieldValue}
                style={[theme.input, theme.inputDefaultText, { minHeight: 120 }]}
                placeholder="Wpisz treść"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  style={[theme.button, { flex: 1, paddingVertical: 8, opacity: saving ? 0.5 : 1 }]}
                  onPress={() => saveField("description")}
                  disabled={saving}
                >
                  <Text style={theme.buttonText}>{saving ? "Zapisywanie..." : "Zapisz"}</Text>
                </Pressable>
                <Pressable
                  style={[theme.button, { flex: 1, paddingVertical: 8, backgroundColor: colors.lightGrey }]}
                  onPress={() => setEditingField(null)}
                  disabled={saving}
                >
                  <Text style={[theme.buttonText, { color: colors.textPrimary }]}>Anuluj</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={[theme.textPrimary, { lineHeight: 22 }]}>
              {news.description || <Text style={theme.textMuted}>Brak treści</Text>}
            </Text>
          )}
        </View>

        {/* Dates footer */}
        <View style={{ backgroundColor: colors.backgroundSoft, borderRadius: 12, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.border }}>
            <Text style={theme.textSecondary}>Dodano</Text>
            <Text style={theme.textPrimary}>{formatDateTime(news.createdAt)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
            <Text style={theme.textSecondary}>Aktywne do</Text>
            <Text style={theme.textPrimary}>{formatDateTime(news.dateOfDeactivate)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
