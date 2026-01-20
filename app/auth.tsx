import { signInWithPhone } from '@/src/services/authService';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function AuthScreen() {
  const router = useRouter();

  const confirmationRef = useRef<any>(null);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const user = auth().currentUser;

//     if (user) {
//       console.log('[AUTH] User already logged in on auth screen, signing out');
//       auth().signOut();
//     }
//   }, []);
  
  function log(label: string, data?: any) {
    const t = new Date().toISOString().split('T')[1];
    console.log(`[AUTH ${t}] ${label}`, data ?? '');
    }

    async function handleSendCode() {
    log('SEND CODE pressed', { phone });

    setError(null);
    setLoading(true);

    try {
        log('Calling signInWithPhone');
        const confirmation = await signInWithPhone(phone);

        log('SMS SENT', {
        confirmationType: typeof confirmation,
        hasConfirmMethod: !!confirmation?.confirm,
        });

        confirmationRef.current = confirmation;
        setStep('code');
    } catch (e: any) {
        log('SEND CODE ERROR', {
        code: e?.code,
        message: e?.message,
        raw: e,
        });
        setError(e.message || 'Failed to send code');
    } finally {
        setLoading(false);
    }
    }


    async function handleConfirmCode() {
    const confirmation = confirmationRef.current;

    log('CONFIRM pressed', {
        hasConfirmation: !!confirmation,
        codeLength: code.length,
    });

    if (!confirmation) {
        log('NO confirmation object');
        setError('Session expired');
        return;
    }

    setError(null);
    setLoading(true);

    try {
        log('CALLING confirmation.confirm()', { code });

        const start = Date.now();
        await confirmation.confirm(code);
        const duration = Date.now() - start;

        log('CONFIRM SUCCESS', { durationMs: duration });

        const user = auth().currentUser;
        log('CURRENT USER AFTER CONFIRM', {
        uid: user?.uid,
        phone: user?.phoneNumber,
        });

        router.replace('/post-auth');
    } catch (e: any) {
        log('CONFIRM ERROR', {
        code: e?.code,
        message: e?.message,
        raw: e,
        });
        setError('Kod nieprawidłowy');
    } finally {
        setLoading(false);
    }
    }


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logowanie</Text>

      {step === 'phone' ? (
        <>
          <Text style={styles.label}>Numer telefonu</Text>
          <TextInput
            placeholder="+48123456789"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Pressable
            style={styles.button}
            onPress={handleSendCode}
            disabled={loading || phone.length < 6}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Wyślij kod</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>Kod SMS</Text>
          <TextInput
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            style={styles.input}
          />

          <Pressable
            style={styles.button}
            onPress={handleConfirmCode}
            disabled={loading || code.length < 4}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Zaloguj</Text>
            )}
          </Pressable>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/* -----------------------------
   Styles
-------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },

  button: {
    backgroundColor: '#1e5eff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  error: {
    marginTop: 16,
    color: '#d00',
    textAlign: 'center',
  },
});
