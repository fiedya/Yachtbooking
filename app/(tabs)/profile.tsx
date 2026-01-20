import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { subscribeToUser } from '../../src/services/userService';

type UserProfile = {
  name: string;
  surname: string;
  phone: string;
  description?: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

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

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Ładowanie profilu…</Text>
      </View>
    );
  }

  const fullName = `${profile.name} ${profile.surname}`;
  const firstLetter = profile.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      {/* Avatar placeholder */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{firstLetter}</Text>
        </View>

        <Pressable style={styles.changePhoto}>
          <Text style={styles.changePhotoText}>Zmień zdjęcie</Text>
        </Pressable>
      </View>

      {/* Name & phone */}
      <Text style={styles.name}>{fullName}</Text>
      <Text style={styles.phone}>{profile.phone}</Text>

      {/* Description */}
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionLabel}>O mnie</Text>
        <Text style={styles.descriptionText}>
          {profile.description || 'Brak opisu'}
        </Text>

        <Pressable style={styles.editDescription}>
          <Text style={styles.editDescriptionText}>
            Edytuj opis
          </Text>
        </Pressable>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.logout]}
          onPress={handleLogout}
        >
          <Text style={[styles.buttonText, styles.logoutText]}>
            Wyloguj się
          </Text>
        </Pressable>
      </View>
    </View>
  );
}


/* -----------------------------
   Styles
-------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    marginTop: 15,
    backgroundColor: '#fff',
  },

  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop:16
  },

  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#e6f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 42,
    fontWeight: '600',
    color: '#1e5eff',
  },

  changePhoto: {
    marginTop: 8,
  },

  changePhotoText: {
    fontSize: 13,
    color: '#1e5eff',
  },

  name: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 8,
  },

  phone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },

  descriptionBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f9fc',
    marginBottom: 32,
  },

  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },

  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  editDescription: {
    marginTop: 8,
  },

  editDescriptionText: {
    fontSize: 13,
    color: '#1e5eff',
  },

  actions: {
    width: '100%',
    marginTop: 'auto',
  },

  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },

  logout: {
    backgroundColor: '#ffe6e6',
  },

  logoutText: {
    color: '#c00',
  },
});
