import { headerStyles } from '@/src/theme/header';
import { styles as theme } from '@/src/theme/styles';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function BookingsToApproveScreen() {
  return (
    <View style={theme.screenPadded}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Nowe bookingi',
          headerStyle: headerStyles.header,
          headerTitleStyle: headerStyles.title
        }}
      />
      </View>
  );
}
