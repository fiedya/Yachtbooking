import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

import { auth } from '../src/firebase/firebaseConfig';
import { Colors } from '../src/theme/colors';
import { Spacing } from '../src/theme/spacing';

export default function AuthScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] =
    useState<ConfirmationResult | null>(null);

  async function sendCode() {
    const result = await signInWithPhoneNumber(auth, phone);
    setConfirmation(result);
  }

  async function confirmCode() {
    if (!confirmation) return;
    await confirmation.confirm(code);
  }

  return (
    <View style={styles.container}>
      {!confirmation ? (
        <>
          <Text>Phone number</Text>
          <TextInput
            placeholder="+48123456789"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
          />
          <Pressable onPress={sendCode} style={styles.button}>
            <Text style={styles.buttonText}>Send code</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text>Verification code</Text>
          <TextInput
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            style={styles.input}
          />
          <Pressable onPress={confirmCode} style={styles.button}>
            <Text style={styles.buttonText}>Confirm</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
});
