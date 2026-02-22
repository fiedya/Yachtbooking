import { NewsCategory, NewsStatus } from "@/src/entities/news";
import { useAuth } from "@/src/providers/AuthProvider";
import { useMode } from "@/src/providers/ModeProvider";
import { addNews } from "@/src/services/newsService";
import { subscribeToUser } from "@/src/services/userService";
import { colors } from "@/src/theme/colors";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function AddNewsScreen() {
  const router = useRouter();
  const { mode } = useMode();
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<NewsCategory>(NewsCategory.General);
  const [dateOfDeactivate, setDateOfDeactivate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const { user, uid, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace("/auth");
      return;
    }
    let unsub: (() => void) | undefined;
    unsub = subscribeToUser(user.uid, (profile) => {
      const admin = profile?.role === "admin" && mode === "admin";
      setIsAdmin(admin);
      // Only redirect if profile loaded and not admin
      if (!admin) {
        router.replace("/(tabs)/calendar");
      }
    });
    return unsub;
  }, [mode]);

  function handleDateChange(event: any, selectedDate?: Date) {
    setShowDatePicker(false);
    if (selectedDate) {
      setTempDate(selectedDate);
      setShowTimePicker(true);
    }
  }

  function handleTimeChange(event: any, selectedTime?: Date) {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(tempDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDateOfDeactivate(newDate);
    }
  }

  async function handleSave() {
    if (!title || !description) return;

    setLoading(true);
    try {
      await addNews({
        title,
        description,
        category,
        dateOfDeactivate,
        status: NewsStatus.Active,
      });

      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Dodaj news",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
        }}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Tytuł */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.title}>Tytuł</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[theme.input, theme.inputDefaultText]}
            placeholder="Tytuł newsa"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        {/* Opis */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.title}>Opis</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[theme.input, theme.inputDefaultText]}
            placeholder="Opis newsa"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Status */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.title}>Kategoria</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={() => setCategory(NewsCategory.General)}
              style={[
                theme.pill,
                category === NewsCategory.General && theme.pillActive,
              ]}
            >
              <Text
                style={
                  category === NewsCategory.General
                    ? theme.textOnPrimary
                    : theme.textSecondary
                }
              >
                Ogólne
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setCategory(NewsCategory.Yachts)}
              style={[
                theme.pill,
                category === NewsCategory.Yachts && theme.pillActive,
              ]}
            >
              <Text
                style={
                  category === NewsCategory.Yachts
                    ? theme.textOnPrimary
                    : theme.textSecondary
                }
              >
                Jachty
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setCategory(NewsCategory.Stanica)}
              style={[
                theme.pill,
                category === NewsCategory.Stanica && theme.pillActive,
              ]}
            >
              <Text
                style={
                  category === NewsCategory.Stanica
                    ? theme.textOnPrimary
                    : theme.textSecondary
                }
              >
                Stanica
              </Text>
            </Pressable>
          </View>
        </View>
        {/* Data dezaktywacji */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.title}>Data dezaktywacji</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={theme.input}
          >
            <Text>
              {dateOfDeactivate
                ? dateOfDeactivate.toLocaleString()
                : "Wybierz datę i godzinę"}
            </Text>
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={tempDate}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </ScrollView>
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#eee",
        }}
      >
        <Pressable
          style={[
            theme.button,
            { opacity: loading || !title || !description ? 0.5 : 1 },
          ]}
          onPress={handleSave}
          disabled={loading || !title || !description}
        >
          <Text style={theme.buttonText}>
            {loading ? "Zapisywanie…" : "Zapisz"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
