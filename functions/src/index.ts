/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
//import {onRequest} from "firebase-functions/https";
//import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10, region: "europe-west1" });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import fetch from "node-fetch";

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp();
}

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

const userStatusMessages: Record<number, { title: string; body: string }> = {
  1: { title: "Zaakceptowano booking", body: "Twój booking został zaakceptowany." },
  2: { title: "Odrzucono booking", body: "Twój booking został odrzucony." },
};

export const notifyBookingUpdated = onDocumentUpdated(
  { document: "bookings/{bookingId}", region: "europe-west1" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;
    if (before.status === after.status) return;

    // Notify user on approved/rejected
    const userMessage = userStatusMessages[after.status];
    if (userMessage) {
      const userId = after.userId;
      if (userId) {
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        const pushToken = userDoc.get("pushToken");
        if (pushToken) {
          try {
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ to: pushToken, title: userMessage.title, body: userMessage.body }),
            });
            const result = await response.json();
            console.log("Expo push response:", JSON.stringify(result));
          } catch (err) {
            console.error("Failed to send push notification to user", err);
          }
        }
      }
    }

    // Notify admins on cancelled (status 3)
    if (after.status === 3) {
      const tokens = await getAdminPushTokens();
      const userName = after.userName ?? "A user";
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