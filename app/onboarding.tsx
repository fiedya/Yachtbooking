import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
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
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Witaj 👋</Text>
        <Text style={styles.subtitle}>
          Uzupełnij swoje dane, aby kontynuować
        </Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Imię"
            value={name}
            onChangeText={setName}
            style={styles.input}
            autoCapitalize="words"
          />

          <TextInput
            placeholder="Nazwisko"
            value={surname}
            onChangeText={setSurname}
            style={styles.input}
            autoCapitalize="words"
          />
        </View>

        <Pressable
          style={[
            styles.button,
            (!name || !surname) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!name || !surname || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Zapisywanie…' : 'Kontynuuj'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/* -----------------------------
   Styles
-------------------------------- */

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
  },

  form: {
    gap: 12,
    marginBottom: 32,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },

  button: {
    backgroundColor: '#1e5eff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonDisabled: {
    backgroundColor: '#a5b8ff',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
