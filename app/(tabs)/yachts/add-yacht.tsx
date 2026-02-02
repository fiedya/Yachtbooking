import { useMode } from "@/app/providers/ModeProvider";
import { YachtStatus } from "@/src/entities/yacht";
import { uploadImage } from "@/src/services/imageUploadService";
import { subscribeToUser } from "@/src/services/userService";
import { addYacht } from "@/src/services/yachtService";
import { headerStyles } from "@/src/theme/header";
import { styles as theme } from "@/src/theme/styles";
import { pickImageFromGallery } from "@/src/utils/pickImage";
import auth from "@react-native-firebase/auth";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AddEditYachtScreen() {
  const router = useRouter();

  const { mode } = useMode();
  const [isAdmin, setIsAdmin] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(true);
  const [status, setStatus] = useState<YachtStatus>(YachtStatus.Available);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    const unsub = subscribeToUser(user.uid, (profile) => {
      setIsAdmin(profile?.role === "admin" && mode === "admin");
    });
    return unsub;
  }, [mode]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      router.replace("/auth");
      return;
    }

    const unsub = subscribeToUser(user.uid, (profile) => {
      if (!isAdmin) {
        router.replace("/(tabs)/calendar");
      }
    });

    return unsub;
  }, []);
  async function handlePickImage() {
    const localUri = await pickImageFromGallery();
    if (!localUri) return;

    setLoading(true);
    try {
      // temporary ID for preview uploads
      const tempId = `temp-${Date.now()}`;

      const url = await uploadImage(localUri, `yachts/${tempId}/main.jpg`);

      setImageUrl(url);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name || !type) return;

    setLoading(true);
    try {
      await addYacht({
        name,
        type,
        description,
        shortcut,
        imageUrl,
        active,
        status,
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
          title: "Jacht",
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
        }}
      />

      {/* 🔁 Scrollable content */}
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120, // space for fixed button
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Image picker */}
        <View style={[theme.card, theme.cardPadding]}>
          <View
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#eee",
              marginBottom: 4,
            }}
          >
            {imageUrl ? (
              <Image
                key={imageUrl}
                source={{ uri: imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require("@/assets/images/yacht_placeholder.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            )}
          </View>

          <Pressable onPress={handlePickImage}>
            <Text style={theme.link}>
              {imageUrl ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
            </Text>
          </Pressable>
        </View>

        {/* Status */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.title}>Status</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={() => setStatus(YachtStatus.Available)}
              style={[
                theme.pill,
                status === YachtStatus.Available && theme.pillActive,
              ]}
            >
              <Text
                style={
                  status === YachtStatus.Available
                    ? theme.textOnPrimary
                    : theme.textSecondary
                }
              >
                Dostępny
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setStatus(YachtStatus.Maintenance)}
              style={[
                theme.pill,
                status === YachtStatus.Maintenance && theme.pillActive,
              ]}
            >
              <Text
                style={
                  status === YachtStatus.Maintenance
                    ? theme.textOnPrimary
                    : theme.textSecondary
                }
              >
                Serwis
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setStatus(YachtStatus.Disabled)}
              style={[
                theme.pill,
                status === YachtStatus.Disabled && theme.pillActive,
              ]}
            >
              <Text
                style={
                  status === YachtStatus.Disabled
                    ? theme.textOnPrimary
                    : theme.textSecondary
                }
              >
                Wyłączony
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Nazwa */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.title}>Nazwa</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={theme.input}
            placeholder="np. Y1, Sunset"
          />
        </View>

        {/* Shortcut */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.title}>Skrót</Text>
          <TextInput
            value={shortcut}
            onChangeText={setShortcut}
            style={theme.input}
            placeholder="np. Y1, Sunset"
          />
        </View>

        {/* Typ */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.title}>Typ</Text>
          <TextInput
            value={type}
            onChangeText={setType}
            style={theme.input}
            placeholder=""
          />
        </View>

        {/* Description */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.title}>Opis</Text>
          <TextInput
            placeholder="Opis"
            value={description}
            onChangeText={setDescription}
            style={theme.input}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* 🔒 Fixed bottom button */}
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
            { opacity: loading || !name || !type ? 0.5 : 1 },
          ]}
          onPress={handleSave}
          disabled={loading || !name || !type}
        >
          <Text style={theme.buttonText}>
            {loading ? "Zapisywanie…" : "Zapisz"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
