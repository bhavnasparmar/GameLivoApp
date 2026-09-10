import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── FriendRequestsScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement FriendRequestsScreen screen

const FriendRequestsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>FriendRequestsScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default FriendRequestsScreen;
