import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { registerUser } from "./authService"; // Make sure path is correct

export default function SignupScreen({ navigation }) {
  // States for form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emoji, setEmoji] = useState("😊");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Signup handler
  const handleSignup = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const user = await registerUser(email, password, name, phone, emoji);
      Alert.alert("Success", "User registered! UID: " + user.uid);
      // Navigate to Home or Dashboard screen
      // navigation.replace("HomeScreen"); // Uncomment when ready
    } catch (error) {
      Alert.alert("Signup failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        style={styles.input}
        placeholder="Emoji (optional)"
        value={emoji}
        onChangeText={setEmoji}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={loading ? "Registering..." : "Sign Up"}
        onPress={handleSignup}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#EFE4D2", // Your app bg color
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
});
