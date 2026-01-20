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