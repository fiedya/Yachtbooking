import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/theme/colors';
import { Spacing } from '../../src/theme/spacing';
import { Typography } from '../../src/theme/typography';

export default function BookScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book yacht</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
});
