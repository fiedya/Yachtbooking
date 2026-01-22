import { headerStyles } from '@/src/theme/header';
import { styles as theme } from '@/src/theme/styles';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function UsersToVerifyScreen() {
  return (
    <View style={theme.screenPadded}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Nowi użytkownicy',
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title
        }}
      />
      </View>
  );
}
