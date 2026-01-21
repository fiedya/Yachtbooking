import { subscribeToUser } from '@/src/services/userService';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useMode } from '../providers/ModeProvider';

export default function AdminScreen() {
  const router = useRouter();
  const { mode } = useMode(); 
  const user = auth().currentUser;

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }

    const unsub = subscribeToUser(user.uid, (profile) => {
      if (profile.role !== 'admin' || mode !== 'admin') {
        router.replace('/(tabs)/calendar');
      }
    });

    return unsub;
  }, [user?.uid, mode]); // ✅ mode included

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Admin panel</Text>
    </View>
  );
}
