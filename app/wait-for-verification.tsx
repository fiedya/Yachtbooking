import { styles as theme } from "@/src/theme/styles";
import { Text, View } from "react-native";

export default function WaitForVerificationScreen() {
  return (
    <View style={[theme.screenPadded, theme.center]}>
      <Text style={theme.title}>Waiting for verification</Text>

      <Text
        style={[
          theme.textSecondary,
          { textAlign: "center", marginVertical: 16 },
        ]}
      >
        Twoje dane zostały wysłane do administratora. Administrator musi
        zweryfikować Twoje członkostwo, zanim będziesz mógł/a korzystać
        aplikacji.
      </Text>

      <Text style={theme.textMuted}>
        (Wróć za chwilę lub skontaktuj się ze mną.)
      </Text>
    </View>
  );
}
