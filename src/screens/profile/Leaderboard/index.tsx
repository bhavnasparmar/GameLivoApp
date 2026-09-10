import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── LeaderboardScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement LeaderboardScreen screen

const LeaderboardScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>LeaderboardScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default LeaderboardScreen;
