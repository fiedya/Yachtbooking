import { Yacht } from '@/src/entities/yacht';
import { subscribeToYachts } from '@/src/services/yachtService';
import { colors } from '@/src/theme/colors';
import { styles as theme } from '@/src/theme/styles';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  Text
} from 'react-native';
import { useMode } from '../providers/ModeProvider';


export default function YachtsScreen() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const { mode } = useMode();
  useEffect(() => {
    const unsubscribe = subscribeToYachts(setYachts);
    return unsubscribe;
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Jachty',
        }}
      />

      <FlatList
        data={yachts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={theme.listPadding}
        renderItem={({ item }) => (
          <Pressable
            style={theme.card}
            onPress={() =>
              router.push({
                pathname: '/subtabs/yacht-details',
                params: { id: item.id },
              })
            }

          >
            <Image
              source={{ uri: item.imageUrl }}
              style={theme.cardImage}
            />
            <Text style={theme.cardTitle}>{item.name}</Text>
          </Pressable>
        )}
      />
      {mode === 'admin' && (
        <Pressable
          onPress={() => router.push('/subtabs/add-edit-yacht')}
          style={{
            position: 'absolute',
            right: 20,
            bottom: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 4,
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}

    </>
  );

}