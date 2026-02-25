import Icon from "@/src/components/Icon";
import { News, NewsCategory } from "@/src/entities/news";
import { getNewsCategoryLabel } from "@/src/helpers/enumHelper";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeContext";
import { getNewsById, updateNews } from "@/src/services/newsService";
import { subscribeToUser } from "@/src/services/userService";
import { createHeaderStyles } from "@/src/theme/header";
import { spacing } from "@/src/theme/spacing";
import { createStyles } from "@/src/theme/styles";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useMode } from "../../../src/providers/ModeProvider";

export default function NewsDetailsScreen() {
  const { colors } = useTheme();
  const theme = createStyles(colors);
  const headerStyles = createHeaderStyles(colors);
  const { mode } = useMode();
  const [isAdmin, setIsAdmin] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [news, setNews] = useState<News | null>(null);
  const [editingField, setEditingField] = useState<null | "title" | "description" | "category">(
    null
  );
  const [fieldValue, setFieldValue] = useState<string>("");
  const [categoryValue, setCategoryValue] = useState<NewsCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const { user, uid, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    getNewsById(id).then(setNews);
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (profile) => {
      setIsAdmin(profile?.role === "admin" && mode === "admin");
    });
    return unsub;
  }, [mode]);

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
      // Optionally show error
      console.error("Save news field error", e);
    } finally {
      setSaving(false);
    }
  };

  if (!news) {
    return (
      <View style={theme.screen}>
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
        contentContainerStyle={{ flexGrow: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[theme.card, theme.cardPadding]}>

          <Text style={{ color: colors.textMuted, marginBottom: 8 }}>
            Dodano: {news.createdAt?.toDate ? news.createdAt.toDate().toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>

          {/* Editable Description */}
          {editingField === "description" ? (
            <View style={{ marginTop: 8 }}>
              <TextInput
                value={fieldValue}
                onChangeText={setFieldValue}
                style={[theme.input, theme.inputDefaultText, { minHeight: 80 }]}
                placeholder="Wpisz opis"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              <Pressable
                style={{
                  backgroundColor: theme.link.color,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 4,
                  alignSelf: "flex-start",
                  opacity: saving ? 0.5 : 1,
                  marginTop: 8,
                }}
                onPress={() => saveField("description")}
                disabled={saving}
              >
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: "600" }}>
                  {saving ? "Zapisywanie..." : "Zapisz"}
                </Text>
              </Pressable>
              <Pressable
                style={{ marginTop: 4, alignSelf: "flex-start" }}
                onPress={() => setEditingField(null)}
                disabled={saving}
              >
                <Text style={{ color: colors.danger }}>Anuluj</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginVertical: spacing.xs
              }}
              onPress={isAdmin ? () => startEdit("description") : undefined}
              disabled={!isAdmin}
            >
              <View style={{ flex: 1 }}>
                <Text style={theme.bodyText}>
                  {news && (news.description || "Brak opisu")}
                </Text>
              </View>
              {isAdmin && (
                <Icon
                  type="material" 
                  name="edit"
                  size={18}
                  color={theme.link.color}
                  //style={{ marginLeft: 8 }}
                />
              )}
            </Pressable>
          )}

          {/* Editable Category */}
          <Text style={{ color: colors.textMuted, marginBottom: 8 }}>
            Kategoria: {editingField === 'category' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
                {Object.entries(NewsCategory)
                  .filter(([k, v]) => typeof v === 'number')
                  .map(([key, value]) => (
                    <Pressable
                      key={value as string}
                      onPress={() => setCategoryValue(value as NewsCategory)}
                      style={[
                        theme.pill,
                        theme.pillDefault,
                        categoryValue === value && theme.pillActive,
                        { marginRight: 8, marginBottom: 8 },
                      ]}
                    >
                      <Text style={categoryValue === value ? theme.textOnPrimary : theme.textSecondary}>
                        {getNewsCategoryLabel(value as NewsCategory)}
                      </Text>
                    </Pressable>
                  ))}
                <Pressable onPress={() => saveField('category')} style={[theme.pill, theme.pillSecondary, { marginLeft: 8 }]}> 
                  <Text style={theme.textOnPrimary}>Zapisz</Text>
                </Pressable>
                <Pressable onPress={() => setEditingField(null)} style={[theme.pill, theme.pillDefault, { marginLeft: 8 }]}> 
                  <Text style={theme.textSecondary}>Anuluj</Text>
                </Pressable>
              </View>
            ) : (
              <Text onPress={isAdmin ? () => startEdit('category') : undefined} style={{ textDecorationLine: 'underline' }}>
                {news && getNewsCategoryLabel(news.category)}
                {isAdmin && (
                  <Icon type="material" name="edit" size={16} color={theme.link.color} />//style={{ marginLeft: 4 }} />
                )}
              </Text>
            )}
          </Text>

          {/* Deactivation Date (same format as createdAt) */}
          <Text style={{ color: colors.textMuted, marginBottom: 8 }}>
            Info zniknie: {news.dateOfDeactivate?.toDate ? news.dateOfDeactivate.toDate().toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>


        </View>
      </ScrollView>
    </View>
  );
}
