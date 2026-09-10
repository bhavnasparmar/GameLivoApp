import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── SplashScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement SplashScreen screen

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>SplashScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default SplashScreen;
