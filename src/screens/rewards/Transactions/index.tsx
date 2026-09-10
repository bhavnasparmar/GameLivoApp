import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── TransactionsScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement TransactionsScreen screen

const TransactionsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>TransactionsScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default TransactionsScreen;
