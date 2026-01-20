import firestore from '@react-native-firebase/firestore';

export async function createBooking(params: {
  userId: string;
  userName: string;
  yachtId: string;
  yachtName: string;
  start: Date;
  end: Date;
}) {
  return firestore()
    .collection('bookings')
    .add({
      userId: params.userId,
      userName: params.userName,
      yachtId: params.yachtId,
      yachtName: params.yachtName,
      start: firestore.Timestamp.fromDate(params.start),
      end: firestore.Timestamp.fromDate(params.end),
      status: 'pending',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
}
