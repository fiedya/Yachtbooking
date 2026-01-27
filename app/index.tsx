import { useAuth } from '@/app/providers/AuthProvider';
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

  console.log('[INDEX] Current user:', user);
  if (user) {
    return <Redirect href="/post-auth" />;
  }

  return <Redirect href="/auth" />;
}
