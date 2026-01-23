import { subscribeToUser } from '@/src/services/userService';
import { headerStyles } from '@/src/theme/header';
import { styles } from '@/src/theme/styles';
import auth from '@react-native-firebase/auth';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useMode } from '../../providers/ModeProvider';

export default function AdminScreen() {
  const router = useRouter();
  const { mode } = useMode();
  const user = auth().currentUser;

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }

    const unsub = subscribeToUser(user.uid, profile => {
      if (profile?.role !== 'admin' || mode !== 'admin') {
        router.replace('/(tabs)/calendar');
      }
    });

    return unsub;
  }, [user?.uid, mode]);

  return (
    <View style={styles.screenPadded}>
          <Stack.Screen
            options={{
              headerShown: true,
              title: 'Admin',
              headerStyle: headerStyles.header,
              headerTitleStyle: headerStyles.title
            }}
          />
      <Pressable
        style={[styles.button, { marginBottom: 12 }]}
        onPress={() => router.push('/admin/all-users')}
      >
        <Text style={styles.buttonText}>Użytkownicy</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { marginBottom: 12 }]}
        onPress={() => router.push('/admin/users-to-verify')}
      >
        <Text style={styles.buttonText}>Nowi użytkownicy</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push('/admin/bookings-to-approve')}
      >
        <Text style={styles.buttonText}>Nowe bookingi</Text>
      </Pressable>
    </View>
  );
}
