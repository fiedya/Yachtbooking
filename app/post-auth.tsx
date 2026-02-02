import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getUser } from "../src/services/userService";

export default function PostAuthScreen() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] =
    useState<ReturnType<typeof auth>["currentUser"]>(null);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged((u) => {
      setUser(u);
      setAuthReady(true);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady) return;

    async function decide() {
      if (!user) {
        router.replace("/auth");
        return;
      }

      try {
        await user.reload();
      } catch (e) {
        console.log("[POST-AUTH] User reload failed, signing out.", e);
        await auth().signOut();
        router.replace("/auth");
        return;
      }
      const currentUser = auth().currentUser;
      if (!currentUser) {
        await auth().signOut();
        router.replace("/auth");
        return;
      }


      const userDoc = await getUser(currentUser.uid);
      if (!userDoc) {
        router.replace("/onboarding");
        return;
      }
      if (!userDoc.onboarded) {
        router.replace("/onboarding");
        return;
      }

      await auth().currentUser?.getIdToken(true);

      if (userDoc.status === 0 /* ToVerify */) {
        router.replace("/wait-for-verification");
        return;
      }

      router.replace("/(tabs)/calendar");
    }

    decide();
  }, [authReady]);

        
    useEffect(() => {
      (async () => {
        const user = auth().currentUser;

        const token = await user?.getIdTokenResult(true);
      })();
    }, []);
    
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
