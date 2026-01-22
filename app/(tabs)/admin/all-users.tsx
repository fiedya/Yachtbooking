import { styles as theme } from '@/src/theme/styles';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

type UserRow = {
  uid: string;
  name: string;
  surname: string;
  phone: string;
  status: string;
};

function getStatusLabel(status: string) {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'rejected':
      return 'Rejected';
    default:
      return 'To verify';
  }
}

function getStatusPillStyle(status: string) {
  if (status === 'verified') return theme.pillInvisible;
  if (status === 'to verify') return theme.pillSecondary;
  if (status === 'rejected') return theme.pillActive;
  return theme.pill;
}

export default function AllUsersScreen() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsub = firestore()
    .collection('users')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {

        if (!snapshot) {
          console.log('[ALL USERS] snapshot is null');
          return;
        }

        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            uid: doc.id,
            name: d.name,
            surname: d.surname,
            phone: d.phone,
            status: d.status,
          };
        });

        console.log('[ALL USERS] mapped users:', data);

        setUsers(data);
        setLoading(false);
      },
      error => {
        console.error('[ALL USERS] snapshot error:', error?.message ?? error);
      }
    );

  return unsub;
}, []);



  return (
    <View style={theme.screen}>
      <FlatList
        contentContainerStyle={theme.listPadding}
        data={users}
        keyExtractor={item => item.uid}

        renderItem={({ item }) => (
          <View style={[theme.card, theme.cardPadding]}>
            <View style={[theme.row, { justifyContent: 'space-between' }]}>
              <View>
                <Text style={theme.textPrimary}>
                  {item.name} {item.surname}
                </Text>
                <Text style={theme.textMuted}>{item.phone}</Text>
              </View>

              <View style={[theme.pill, getStatusPillStyle(item.status)]}>
                <Text style={theme.textXs}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={theme.textMuted}>No users found</Text>
          ) : null
        }
      />
    </View>
  );
}
