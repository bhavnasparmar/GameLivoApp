import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── ReportProblemScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement ReportProblemScreen screen

const ReportProblemScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ReportProblemScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default ReportProblemScreen;
