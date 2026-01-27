import { uploadImage } from '@/src/services/imageUploadService';
import { subscribeToUser } from '@/src/services/userService';
import { addYacht } from '@/src/services/yachtService';
import { headerStyles } from '@/src/theme/header';
import { styles as theme } from '@/src/theme/styles';
import { pickImageFromGallery } from '@/src/utils/pickImage';
import auth from '@react-native-firebase/auth';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';


export default function AddEditYachtScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(true);

    useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      router.replace('/auth');
      return;
    }

    const unsub = subscribeToUser(user.uid, profile => {
      if (profile.role !== 'admin') {
        router.replace('/(tabs)/calendar');
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

      const url = await uploadImage(
        localUri,
        `yachts/${tempId}/main.jpg`
      );

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
        title: 'Jacht',
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
            width: '100%',
            height: 200,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: '#eee',
            marginBottom: 4,
          }}
        >
          {imageUrl ? (
            <Image
              key={imageUrl}
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={require('@/assets/images/yacht_placeholder.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          )}
        </View>

        <Pressable onPress={handlePickImage}>
          <Text style={theme.link}>
            {imageUrl ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}
          </Text>
        </Pressable>
      </View>

      {/* Name */}
      <View style={[theme.card, theme.cardPadding]}>
        <Text style={theme.title}>Nazwa jachtu</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={theme.input}
        />
      </View>

      {/* Type */}
      <View style={[theme.card, theme.cardPadding]}>
        <Text style={theme.title}>Typ</Text>
        <TextInput
          value={type}
          onChangeText={setType}
          style={theme.input}
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

      {/* Status */}
      <View style={[theme.card, theme.cardPadding]}>
        <Text style={theme.title}>Status</Text>
        <Pressable
          onPress={() => setActive(a => !a)}
          style={[
            theme.pill,
            active ? theme.pillActive : undefined,
            { alignSelf: 'flex-start' },
          ]}
        >
          <Text
            style={active ? theme.textOnPrimary : theme.textSecondary}
          >
            {active ? 'Aktywny' : 'Nieaktywny'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>

    {/* 🔒 Fixed bottom button */}
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
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
          {loading ? 'Zapisywanie…' : 'Zapisz'}
        </Text>
      </Pressable>
    </View>
  </View>
);

}
