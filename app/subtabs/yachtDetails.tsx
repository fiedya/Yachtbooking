import { Yacht } from '@/src/entities/yacht';
import { getYachtById } from '@/src/services/yachtService';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type Params = {
  YachtDetails: {
    id: string;
  };
};

export default function YachtDetailsScreen() {
  const route = useRoute<RouteProp<Params, 'YachtDetails'>>();
  const { id } = route.params;

  const [yacht, setYacht] = useState<Yacht | null>(null);

  useEffect(() => {
    getYachtById(id).then(setYacht);
  }, [id]);

  if (!yacht) {
    return <Text style={styles.loading}>Loading…</Text>;
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: yacht.imageUrl }} style={styles.image} />
      <Text style={styles.name}>{yacht.name}</Text>
      <Text style={styles.type}>{yacht.type}</Text>
      <Text style={styles.description}>{yacht.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    padding: 20,
    textAlign: 'center',
  },
  container: {
    padding: 16,
  },
  image: {
    height: 220,
    width: '100%',
    borderRadius: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  type: {
    fontSize: 16,
    color: '#666',
    marginVertical: 4,
  },
  description: {
    fontSize: 16,
    marginTop: 12,
    lineHeight: 22,
  },
});
