import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── LoginScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement LoginScreen screen

const LoginScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>LoginScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default LoginScreen;
