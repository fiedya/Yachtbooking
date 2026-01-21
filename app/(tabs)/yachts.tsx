import { Yacht } from '@/src/entities/yacht';
import { subscribeToYachts } from '@/src/services/yachtService';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text
} from 'react-native';

export default function YachtsScreen() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const unsubscribe = subscribeToYachts(setYachts);
    return unsubscribe;
  }, []);

  return (
    <FlatList
      data={yachts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() =>
            navigation.navigate('YachtDetails', { id: item.id })
          }
        >
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
          <Text style={styles.name}>{item.name}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  image: {
    height: 160,
    width: '100%',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    padding: 8,
  },
});
