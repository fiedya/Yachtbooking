import { useAuth } from '@/src/auth/AuthProvider';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/calendar" />;
  }

  return <Redirect href="/auth" />;
}
