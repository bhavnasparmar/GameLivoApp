import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── ForgotPasswordScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement ForgotPasswordScreen screen

const ForgotPasswordScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ForgotPasswordScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default ForgotPasswordScreen;
