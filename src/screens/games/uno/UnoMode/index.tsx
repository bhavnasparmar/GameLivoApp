import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── UnoModeScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement UnoModeScreen screen

const UnoModeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>UnoModeScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default UnoModeScreen;
