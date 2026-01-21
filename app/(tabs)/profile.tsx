import { uploadImage } from '@/src/services/imageUploadService';
import { headerStyles } from '@/src/theme/header';
import { spacing } from '@/src/theme/spacing';
import { styles as theme } from '@/src/theme/styles';
import { pickImageFromGallery } from '@/src/utils/pickImage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User } from '../../src/entities/user';
import { subscribeToUser } from '../../src/services/userService';
import { useMode } from '../providers/ModeProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const { mode, toggleMode } = useMode();
  const insets = useSafeAreaInsets();
  const user = auth().currentUser;

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeToUser(user.uid, data => {
      setProfile(data);
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


      {/* Avatar placeholder */}
    <View style={[theme.center, { marginBottom: 16, marginTop: 16 }]}>
      
      <Pressable
        style={{ marginTop: 8 }}
        onPress={handleChangeAvatar}
      >
      <View style={theme.avatar}>
        {profile.photoUrl ? (
          <Image
            key={profile.photoUrl} // 🔥 FORCE REMOUNT
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


      {/* Description */}
      <View style={[theme.card, theme.cardPadding]}>
        <Text style={theme.sectionTitle}>O mnie</Text>
        <Text style={theme.textPrimary}>
          {profile.description || 'Brak opisu'}
        </Text>


        <Pressable style={{ marginTop: 8 }}>
          <Text style={theme.link}>Edytuj opis</Text>
        </Pressable>

      </View>

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

