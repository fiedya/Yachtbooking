import { Note } from "@/src/entities/note";
import { addDocAuto, onDocSnapshot, onSnapshot, serverTimestamp, updateDoc } from "@/src/firebase/init";

export async function createNote(params: {
  bookingId: string;
  content: string;
  creatorId: string;
  creatorWasAdmin: boolean;
}) {
  return addDocAuto("notes", {
    bookingId: params.bookingId,
    content: params.content,
    creatorId: params.creatorId,
    creatorWasAdmin: params.creatorWasAdmin,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNoteAsRead(noteId: string) {
  return updateDoc("notes", noteId, { read: true });
}

export async function updateNoteReadStatus(noteId: string, read: boolean) {
  return updateDoc("notes", noteId, { read });
}

export function subscribeToNote(
  noteId: string,
  onChange: (note: Note | null) => void,
  onError?: (error: unknown) => void,
) {
  if (!noteId) {
    onChange(null);
    return () => {};
  }

  return onDocSnapshot(
    "notes",
    noteId,
    (snap: any) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }

      onChange({
        id: snap.id,
        ...(snap.data() as Omit<Note, "id">),
      });
    },
    onError,
  );
}

export function subscribeToAllNotes(
  onChange: (notes: Note[]) => void,
  onError?: (error: unknown) => void,
) {
  return onSnapshot(
    "notes",
    (snapshot: any) => {
      if (!snapshot) {
        onChange([]);
        return;
      }

      const docs = snapshot.docs ?? snapshot._docs ?? [];
      const notes: Note[] = docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as Omit<Note, "id">),
      }));

      onChange(notes);
    },
    onError,
  );
}

export function subscribeToNotesForBooking(
  bookingId: string,
  onChange: (notes: Note[]) => void,
  onError?: (error: unknown) => void,
) {
  if (!bookingId) {
    onChange([]);
    return () => {};
  }

  return onSnapshot(
    "notes",
    (snapshot: any) => {
      if (!snapshot) {
        onChange([]);
        return;
      }

      const docs = snapshot.docs ?? snapshot._docs ?? [];
      const notes: Note[] = docs
        .map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as Omit<Note, "id">),
        }))
        .filter((note: Note) => note.bookingId === bookingId);

      onChange(notes);
    },
    onError,
  );
}
