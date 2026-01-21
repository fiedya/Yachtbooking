import { Yacht } from '@/src/entities/yacht';
import { getYachtById } from '@/src/services/yachtService';
import { headerStyles } from '@/src/theme/header';
import { styles as theme } from '@/src/theme/styles';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

export default function YachtDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [yacht, setYacht] = useState<Yacht | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    getYachtById(id).then(setYacht);
  }, [id]);

  if (!yacht) {
    return (
      <View style={theme.screen}>
        <Text style={theme.textMuted}>Ładowanie…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: yacht.name,
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title,
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 🖼 Hero image */}
        <View
          style={{
            width: '100%',
            height: 240,
            backgroundColor: '#eee',
          }}
        >
          <Image
            source={
              yacht.imageUrl
                ? { uri: yacht.imageUrl }
                : require('@/assets/images/yacht_placeholder.png')
            }
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        {/* 📄 Content */}
        <View style={theme.screenPadded}>

          {/* Description */}
          {!!yacht.type && (
            <View style={{marginBottom:10}}>
              <Text style={theme.sectionTitle}>
                Typ
              </Text>

              <Text style={theme.bodyText}>
                {yacht.type}
              </Text>
            </View>
          )}

          {/* Description */}
          {!!yacht.description && (
            <View>
              <Text style={theme.sectionTitle}>
                Opis
              </Text>

              <Text style={theme.bodyText}>
                {yacht.description}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
