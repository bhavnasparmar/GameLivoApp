import React from "react";
import { View, Text, StyleSheet } from "react-native";

// ─── FriendProfileScreen Screen ───────────────────────────────────────────────────────
// TODO: Implement FriendProfileScreen screen

const FriendProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>FriendProfileScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08120D", alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontSize: 18 },
});

export default FriendProfileScreen;
