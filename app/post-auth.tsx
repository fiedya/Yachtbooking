import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getUser } from '../src/services/userService';

export default function PostAuthScreen() {
  const router = useRouter();

  useEffect(() => {
    async function decide() {
      const user = auth().currentUser;

      if (!user) {
        router.replace('/auth');
        return;
      }

      const userDoc = await getUser(user.uid);

      // No user doc → force onboarding
      if (!userDoc) {
        router.replace('/onboarding');
        return;
      }

      // Not onboarded → onboarding
      if (!userDoc.onboarded) {
        router.replace('/onboarding');
        return;
      }

      // Onboarded but NOT verified → wait screen
      console.log(userDoc.status)
      if (userDoc.status !== 'verified') {
        router.replace('/wait-for-verification');
        return;
      }

      router.replace('/(tabs)/calendar');
    }

    decide();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
