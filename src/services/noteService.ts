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

export async function rejectNote(noteId: string) {
  return updateDoc("notes", noteId, { rejected: true });
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
      const notes: Note[] = docs
        .map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as Omit<Note, "id">),
        }))
        .filter((note: Note) => !(note.rejected === true || String(note.rejected).toLowerCase() === "true"));

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
        .filter((note: Note) => note.bookingId === bookingId && !(note.rejected === true || String(note.rejected).toLowerCase() === "true"));

      onChange(notes);
    },
    onError,
  );
}

export function subscribeToNotesForBookingIds(
  bookingIds: string[],
  onChange: (notes: Note[]) => void,
  onError?: (error: unknown) => void,
) {
  const uniqueBookingIds = Array.from(new Set(bookingIds.filter(Boolean)));

  if (uniqueBookingIds.length === 0) {
    onChange([]);
    return () => {};
  }

  const chunkSize = 10;
  const chunks: string[][] = [];

  for (let i = 0; i < uniqueBookingIds.length; i += chunkSize) {
    chunks.push(uniqueBookingIds.slice(i, i + chunkSize));
  }

  const notesByChunk = new Map<number, Note[]>();
  const unsubs: Array<() => void> = [];

  const emitMerged = () => {
    const mergedMap = new Map<string, Note>();

    notesByChunk.forEach((chunkNotes) => {
      chunkNotes.forEach((note) => {
        mergedMap.set(note.id, note);
      });
    });

    onChange(Array.from(mergedMap.values()));
  };

  chunks.forEach((chunk, chunkIndex) => {
    const unsub = onSnapshot(
      "notes",
      (snapshot: any) => {
        if (!snapshot) {
          notesByChunk.set(chunkIndex, []);
          emitMerged();
          return;
        }

        const docs = snapshot.docs ?? snapshot._docs ?? [];
        const notes: Note[] = docs
          .map((doc: any) => ({
            id: doc.id,
            ...(doc.data() as Omit<Note, "id">),
          }))
          .filter((note: Note) => !(note.rejected === true || String(note.rejected).toLowerCase() === "true"));

        notesByChunk.set(chunkIndex, notes);
        emitMerged();
      },
      onError,
      {
        where: ["bookingId", "in", chunk],
      },
    );

    unsubs.push(unsub);
  });

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}
