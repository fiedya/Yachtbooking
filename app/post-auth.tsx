import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getUser } from '../src/services/userService';

export default function PostAuthScreen() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof auth>['currentUser']>(null);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(u => {
      setUser(u);
      setAuthReady(true);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady) return;

    async function decide() {
      console.log("[POST-AUTH] Auth is ready, user:", user?.uid);
      if (!user) {
        router.replace('/auth');
        return;
      }


      const userDoc = await getUser(user.uid);

      console.log("[POST-AUTH] userDoc!.onboarded:", userDoc?.onboarded);
      if (!userDoc || !userDoc.onboarded) {
        router.replace('/onboarding');
        return;
      }

      console.log("[POST-AUTH] userDoc!.status:", userDoc?.status);

      if (userDoc.status !== 'verified') {
        router.replace('/wait-for-verification');
        return;
      }

      console.log('[POST-AUTH] User is onboarded and verified, navigating to main app');
      router.replace('/(tabs)/calendar');
    }

    decide();
  }, [authReady]);

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
