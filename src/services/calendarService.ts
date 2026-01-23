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

export async function getAvailableYachtIds(
  start: Date,
  end: Date
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

  return Array.from(busyYachtIds);
}