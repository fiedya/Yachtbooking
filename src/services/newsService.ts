import {
  addDocAuto,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "@/src/firebase/init";
import { News } from "../entities/news";

const NEWS_COLLECTION = "news";

/* ----------------------------------
   Realtime subscription
----------------------------------- */

export function subscribeToNews(
  onChange: (news: News[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    NEWS_COLLECTION,
    (snapshot: any) => {
      if (!snapshot) {
        onChange([]);
        return;
      }

      const docs = snapshot.docs ?? snapshot._docs ?? [];

      const news: News[] = docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as Omit<News, "id">),
      }));

      onChange(news);
    },
    onError,
  );
}

/* ----------------------------------
   Read by ID
----------------------------------- */

export async function getNewsById(id: string): Promise<News | null> {
  const snap: any = await getDoc(NEWS_COLLECTION, id);

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...(snap.data() as Omit<News, "id">),
  };
}

/* ----------------------------------
   Create (auto ID)
----------------------------------- */

export async function addNews(
  data: Omit<News, "id" | "createdAt">,
) {
  return addDocAuto(NEWS_COLLECTION, {
    ...data,
    createdAt: serverTimestamp(),
  });
}

/* ----------------------------------
   Update
----------------------------------- */

export async function updateNews(
  id: string,
  data: Partial<Omit<News, "id" | "createdAt">>,
) {
  return updateDoc(NEWS_COLLECTION, id, data);
}
