import { uploadImage } from '@/src/services/imageUploadService';
import { headerStyles } from '@/src/theme/header';
import { spacing } from '@/src/theme/spacing';
import { styles as theme } from '@/src/theme/styles';
import { pickImageFromGallery } from '@/src/utils/pickImage';
import { MaterialIcons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User } from '../../src/entities/user';
import { subscribeToUser, updateUserProfile } from '../../src/services/userService';
import { useMode } from '../providers/ModeProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [editingField, setEditingField] = useState<'pseudonim' | 'description' | null>(null);
  const [description, setDescription] = useState('');
  const [pseudonim, setPseudonim] = useState('');
  const [saving, setSaving] = useState(false);
  const { mode, toggleMode } = useMode();
  const insets = useSafeAreaInsets();
  const user = auth().currentUser;

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeToUser(user.uid, data => {
      setProfile(data);
      if (data) {
        setDescription(data.description || '');
        setPseudonim(data.pseudonim || '');
      }
    });

    return unsub;
  }, [user?.uid]);

  async function handleLogout() {
    try {
      await auth().signOut();
      router.replace('/auth');
    } catch (e) {
      console.error('Logout error', e);
    }
  }

  async function handleChangeAvatar() {
  if (!user?.uid) return;

  const localUri = await pickImageFromGallery();
  if (!localUri) return;

  const imageUrl = await uploadImage(
  localUri,
  `users/${user.uid}/avatar.jpg`
);


  await firestore()
    .collection('users')
    .doc(user.uid)
    .update({ photoUrl: imageUrl });


}

  async function saveField(field: 'pseudonim' | 'description') {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        [field]: field === 'pseudonim' ? pseudonim : description,
      });
      setEditingField(null);
    } catch (e) {
      console.error('Save field error', e);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <View style={[theme.screen, theme.center]}>
        <Text>Ładowanie profilu…</Text>
      </View>
    );
  }

  const fullName = `${profile.name} ${profile.surname}`;
  const firstLetter = profile.name?.charAt(0)?.toUpperCase() ?? '?';
  


  return (
    <View style={theme.screenPadded}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profil',
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
          headerRight: () =>
            profile.role === 'admin' ? (
              <Pressable onPress={toggleMode} style={headerStyles.adminButton}>
                <Text style={headerStyles.adminButtonText}>
                  {mode === 'admin' ? 'User' : 'Admin'}
                </Text>
              </Pressable>
            ) : null,
        }}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      >
        {/* Avatar placeholder */}
        <View style={[theme.center, { marginBottom: 16, marginTop: 16 }]}>
          <Pressable
            style={{ marginTop: 8 }}
            onPress={handleChangeAvatar}
          >
            <View style={theme.avatar}>
              {profile.photoUrl ? (
                <Image
                  key={profile.photoUrl}
                  source={{ uri: profile.photoUrl }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 999,
                  }}
                />
              ) : (
                <Image
                  source={require('@/assets/images/user_placeholder.png')}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 999,
                  }}
                />
              )}
            </View>
            <Text style={[theme.link, {alignSelf: 'center', marginTop: 10}]}>Zmień zdjęcie</Text>
          </Pressable>
        </View>

        {/* Name & phone */}
        <Text style={theme.title}>{fullName}</Text>
        <Text style={theme.textSecondary}>{profile.phone}</Text>

        {/* Pseudonim */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.sectionTitle}>Pseudonim</Text>
          {editingField === 'pseudonim' ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={pseudonim}
                onChangeText={setPseudonim}
                style={theme.input}
                placeholder="Wpisz pseudonim"
                autoFocus
              />
              <Pressable
                style={{ backgroundColor: theme.link.color, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start', opacity: saving ? 0.5 : 1 }}
                onPress={() => saveField('pseudonim')}
                disabled={saving}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  {saving ? 'Zapisywanie...' : 'Zapisz'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable 
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              onPress={() => setEditingField('pseudonim')}
            >
              <Text style={[theme.textPrimary, { flex: 1 }]}>
                {pseudonim || 'Brak pseudonimu'}
              </Text>
              <MaterialIcons name="edit" size={18} color={theme.link.color} style={{ marginLeft: 8 }} />
            </Pressable>
          )}
        </View>

        {/* Description */}
        <View style={[theme.card, theme.cardPadding]}>
          <Text style={theme.sectionTitle}>O mnie</Text>
          {editingField === 'description' ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[theme.input, { minHeight: 100 }]}
                placeholder="Wpisz opis"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
              <Pressable
                style={{ backgroundColor: theme.link.color, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start', opacity: saving ? 0.5 : 1 }}
                onPress={() => saveField('description')}
                disabled={saving}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  {saving ? 'Zapisywanie...' : 'Zapisz'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable 
              style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
              onPress={() => setEditingField('description')}
            >
              <Text style={[theme.textPrimary, { flex: 1 }]}>
                {description || 'Brak opisu'}
              </Text>
              <MaterialIcons name="edit" size={18} color={theme.link.color} style={{ marginLeft: 8 }} />
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={{ width: '100%', marginTop: 'auto' }}>
        <Pressable
          style={[theme.button, theme.buttonDanger]}
          onPress={handleLogout}
        >
          <Text style={theme.buttonDangerText}>
            Wyloguj się
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: spacing.md, marginBottom: 0, alignItems: 'center' }}>
        <Text style={theme.versionText}>
          Version {Constants.expoConfig?.version}
        </Text>
      </View>
    </View>
  );
}

