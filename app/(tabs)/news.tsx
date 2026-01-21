import { headerStyles } from '@/src/theme/header';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function NewsScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Kalendarz',
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title
        }}
      />
      </View>
  );
}
