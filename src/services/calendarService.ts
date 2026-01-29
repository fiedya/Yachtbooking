import firestore from '@react-native-firebase/firestore';

export function subscribeToBookings(
  start: Date,
  end: Date,
  onChange: (bookings: any[]) => void
) {
  return firestore()
    .collection('bookings')
    .where('start', '<', end)
    .where('end', '>', start)
    .onSnapshot(snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      onChange(data);
    });
}


/**
 * Returns yacht IDs that are busy (booked) in the given time range, unless it's the yacht of the booking being edited.
 * @param start
 * @param end
 * @param editingBookingId (optional) - if provided, always include the yacht from this booking as available
 */
export async function getAvailableYachtIds(
  start: Date,
  end: Date,
  editingBookingId?: string | null
): Promise<string[]> {
  const snapshot = await firestore()
    .collection('bookings')
    .where('start', '<', end)
    .where('end', '>', start)
    .where('status', 'in', ['pending', 'approved'])
    .get();

  const busyYachtIds = new Set(
    snapshot.docs.map(doc => doc.data().yachtId)
  );

  // If editing, remove the yachtId of the booking being edited from busy list
  if (editingBookingId) {
    const editingDoc = await firestore().collection('bookings').doc(editingBookingId).get();
    const editingYachtId = editingDoc.exists() ? editingDoc.data()?.yachtId : null;
    if (editingYachtId) {
      busyYachtIds.delete(editingYachtId);
    }
  }

  return Array.from(busyYachtIds);
}