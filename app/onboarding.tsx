import { styles as theme } from '@/src/theme/styles';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { createOrUpdateUser } from '../src/services/userService';


export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

async function handleContinue() {
    console.log('[ONBOARDING] Continue pressed');

    if (!name.trim() || !surname.trim()) {
      console.log('[ONBOARDING] Missing name or surname');
      return;
    }

    const user = auth().currentUser;
    console.log('[ONBOARDING] currentUser:', {
      uid: user?.uid,
      phone: user?.phoneNumber,
    });

    if (!user) return;

    setLoading(true);

    try {
      console.log('[ONBOARDING] calling createOrUpdateUser');

      await createOrUpdateUser(
        user.uid,
        user.phoneNumber || '',
        name.trim(),
        surname.trim()
      );

      console.log('[ONBOARDING] createOrUpdateUser SUCCESS');
      router.replace('/(tabs)/calendar');
    } catch (e) {
      console.error('[ONBOARDING] ERROR during save', e);
    } finally {
      setLoading(false);
    }
  }



  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={theme.screenPadded}>

    <Text style={theme.title}>Witaj 👋</Text>
    <Text style={theme.textSecondary}>
      Uzupełnij swoje dane, aby kontynuować
    </Text>


        <View style={{ gap: 12, marginBottom: 32 }}>
          <TextInput
            placeholder="Imię"
            value={name}
            onChangeText={setName}
            style={theme.input}
              autoCapitalize="words"
          />

          <TextInput
            placeholder="Nazwisko"
            value={surname}
            onChangeText={setSurname}
            style={theme.input}
            autoCapitalize="words"
          />
        </View>

    <Pressable
      style={[
        theme.button,
        (!name || !surname) && theme.buttonDisabled,
      ]}
      onPress={handleContinue}
      disabled={!name || !surname || loading}
    >
      <Text style={theme.buttonText}>
        {loading ? 'Zapisywanie…' : 'Kontynuuj'}
      </Text>
    </Pressable>

      </View>
    </KeyboardAvoidingView>
  );
}

