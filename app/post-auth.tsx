import { useAuth } from "@/src/providers/AuthProvider";
import { getUser } from "@/src/services/userService";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function PostAuthScreen() {
  const router = useRouter();
  const { user, uid, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    async function decide() {
      // 🔒 Not signed in
      if (!user || !uid) {
        router.replace("/auth");
        return;
      }

      // 🔁 Ensure Firebase session is still valid
      try {
        await user.reload();
      } catch (e) {
        console.log("[POST-AUTH] reload failed, signing out", e);
        await user.signOut();
        router.replace("/auth");
        return;
      }


      // 🔥 Fetch Firestore user document
      const userDoc = await getUser(uid);

      if (!userDoc || !userDoc.onboarded) {
        router.replace("/onboarding");
        return;
      }

      // 🔑 Force fresh token (permissions, claims)
      await user.getIdToken(true);

      if (userDoc.status === 0 /* ToVerify */) {
        router.replace("/wait-for-verification");
        return;
      }

      router.replace("/(tabs)/calendar");
    }

    decide();
  }, [loading, user, uid]);

  return null;
}
