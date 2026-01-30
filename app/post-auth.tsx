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
      console.log("[POST-AUTH] Auth is ready, user:", user?.uid);
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
        console.log("[POST-AUTH] User no longer exists in Firebase Auth, signing out.");
        await auth().signOut();
        router.replace("/auth");
        return;
      }


      const userDoc = await getUser(currentUser.uid);
      if (!userDoc) {
        console.log("[POST-AUTH] User doc missing in Firestore, routing to onboarding.");
        router.replace("/onboarding");
        return;
      }

      console.log("[POST-AUTH] userDoc!.onboarded:", userDoc?.onboarded);
      if (!userDoc.onboarded) {
        router.replace("/onboarding");
        return;
      }

      console.log("[POST-AUTH] userDoc!.status:", userDoc?.status);


      await auth().currentUser?.getIdToken(true);




      if (userDoc.status === 0 /* ToVerify */) {
        router.replace("/wait-for-verification");
        return;
      }

      console.log(
        "[POST-AUTH] User is onboarded and verified, navigating to main app",
      );
      router.replace("/(tabs)/calendar");
    }

    decide();
  }, [authReady]);

        
    useEffect(() => {
      (async () => {
        const user = auth().currentUser;
        console.log("UID:", user?.uid);

        const token = await user?.getIdTokenResult(true);
        console.log("TOKEN CLAIMS:", token?.claims);
      })();
    }, []);
    
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
