import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({ maxInstances: 10, region: "europe-west1" });

import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import fetch from "node-fetch";

if (!admin.apps.length) {
  admin.initializeApp();
}

/* ----------------------------------
   Push notification helpers
----------------------------------- */

async function getAdminPushTokens(): Promise<string[]> {
  const snapshot = await admin.firestore().collection("users")
    .where("role", "==", "admin")
    .get();
  return snapshot.docs
    .map(doc => doc.get("pushToken"))
    .filter(Boolean);
}

async function sendPushNotifications(tokens: string[], title: string, body: string) {
  await Promise.all(tokens.map(token =>
    fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: token, title, body }),
    })
  ));
}

/* ----------------------------------
   Duty coverage helper
----------------------------------- */

function isFullyCovered(
  bookingStart: Date,
  bookingEnd: Date,
  duties: Array<{ start: Date; end: Date }>,
): boolean {
  const sorted = [...duties].sort((a, b) => a.start.getTime() - b.start.getTime());
  let covered = bookingStart.getTime();
  for (const d of sorted) {
    if (d.start.getTime() > covered) return false;
    covered = Math.max(covered, d.end.getTime());
    if (covered >= bookingEnd.getTime()) return true;
  }
  return covered >= bookingEnd.getTime();
}

/* ----------------------------------
   Existing notification functions
----------------------------------- */

const STATUS_LABELS: Record<number, string> = {
  0: "Oczekujący",
  1: "Zaakceptowany",
  2: "Odrzucony",
  3: "Anulowany",
  4: "Brak dyżurnego",
};

async function sendPushToUser(userId: string, title: string, body: string) {
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  const pushToken = userDoc.get("pushToken");
  if (!pushToken) return;
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: pushToken, title, body }),
    });
    const result = await response.json();
    console.log("Expo push response:", JSON.stringify(result));
  } catch (err) {
    console.error("Failed to send push notification to user", err);
  }
}

export const notifyBookingUpdated = onDocumentUpdated(
  { document: "bookings/{bookingId}", region: "europe-west1" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;
    if (before.status === after.status) return;

    const userId = after.userId as string | undefined;
    const userName = after.userName ?? "Użytkownik";

    // 4.1 — notify user when status changes to approved or rejected
    if (after.status === 1 || after.status === 2) {
      const label = STATUS_LABELS[after.status] ?? String(after.status);
      if (userId) {
        await sendPushToUser(
          userId,
          "Status rezerwacji zmieniony",
          `Twój booking zmienił status na: ${label}`,
        );
      }
    }

    // 4.2 + 4.3 — duty officer assigned: status NoDutyOfficer (4) → Pending (0)
    if (before.status === 4 && after.status === 0) {
      if (userId) {
        await sendPushToUser(
          userId,
          "Dyżur uzupełniony",
          "Uzupełnienie dyżuru w trakcie Twojego bookingu",
        );
      }
      const adminTokens = await getAdminPushTokens();
      await sendPushNotifications(adminTokens, "Dyżur uzupełniony", "Jeden z bookingów ma uzupełniony dyżur");
    }

    // Notify admins on cancelled (status 3)
    if (after.status === 3) {
      const tokens = await getAdminPushTokens();
      await sendPushNotifications(tokens, "Booking anulowany", `${userName} anulował swój booking.`);
    }
  }
);

export const notifyAdminsNewBooking = onDocumentCreated(
  { document: "bookings/{bookingId}", region: "europe-west1" },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const tokens = await getAdminPushTokens();
    if (!tokens.length) return;
    const userName = data.userName ?? "A user";
    await sendPushNotifications(tokens, "Nowy booking", `${userName} zarezerwował jacht.`);
  }
);

export const notifyAdminsNewUser = onDocumentCreated(
  { document: "users/{userId}", region: "europe-west1" },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const tokens = await getAdminPushTokens();
    if (!tokens.length) return;
    const name = data.name && data.surname ? `${data.name} ${data.surname}` : "Someone";
    await sendPushNotifications(tokens, "Nowy użytkownik", `${name} utworzył konto.`);
  }
);

/* ----------------------------------
   onDutyCreated — promote NoDutyOfficer bookings to Pending
   when a new duty fills their coverage gap
----------------------------------- */

export const onDutyCreated = onDocumentCreated(
  { document: "duties/{dutyId}", region: "europe-west1" },
  async (event) => {
    const duty = event.data?.data();
    if (!duty) return;

    const db = admin.firestore();
    const dutyStart: FirebaseFirestore.Timestamp = duty.start;
    const dutyEnd: FirebaseFirestore.Timestamp = duty.end;

    // Find NoDutyOfficer (status=4) bookings that overlap with the new duty's time range
    const bookingsSnap = await db
      .collection("bookings")
      .where("status", "==", 4)
      .where("start", "<", dutyEnd)
      .where("end", ">", dutyStart)
      .get();

    if (bookingsSnap.empty) return;

    await Promise.all(
      bookingsSnap.docs.map(async (bookingDoc) => {
        const booking = bookingDoc.data();
        const bookingStart: Date = booking.start.toDate();
        const bookingEnd: Date = booking.end.toDate();

        // Fetch all duties that overlap with this booking
        const dutiesSnap = await db
          .collection("duties")
          .where("start", "<", booking.end)
          .where("end", ">", booking.start)
          .get();

        const duties = dutiesSnap.docs.map((d) => ({
          start: d.data().start.toDate() as Date,
          end: d.data().end.toDate() as Date,
        }));

        if (isFullyCovered(bookingStart, bookingEnd, duties)) {
          await bookingDoc.ref.update({ status: 0 }); // Pending
          console.log(`[onDutyCreated] Promoted booking ${bookingDoc.id} to Pending`);
        }
      }),
    );
  }
);
