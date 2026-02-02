import firestore from "@react-native-firebase/firestore";
import { News } from "../entities/news";

const NEWS_COLLECTION = "news";

export function subscribeToNews(
  onChange: (news: News[]) => void,
  onError?: (error: unknown) => void,
) {
  return firestore()
    .collection("news")
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) {
          onChange([]);
          return;
        }

        const news = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<News, "id">),
        }));

        onChange(news);
      },
      (error) => {
        console.error("Firestore news subscription error:", error);
        onError?.(error);
      },
    );
}

export async function getNewsById(id: string): Promise<News | null> {
  const docSnap = await firestore().collection("news").doc(id).get();

  if (!docSnap.exists) {
    return null;
  }

  return {
    id: docSnap.id,
    ...(docSnap.data() as Omit<News, "id">),
  };
}

export async function addNews(data: Omit<News, "id" | "createdAt">) {
  return firestore()
    .collection("news")
    .add({
      ...data,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
}

export async function updateNews(
  id: string,
  data: Partial<Omit<News, "id" | "createdAt">>,
) {
  return firestore().collection("news").doc(id).update(data);
}
