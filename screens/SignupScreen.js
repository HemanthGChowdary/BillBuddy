import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, Typography, Spacing, BorderRadius } from "../styles/theme";
import { registerUser } from "../utils/authService";

export default function SignupScreen({ navigation, darkMode = false }) {
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
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? Colors.background.dark : Colors.background.light }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: true }}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={darkMode ? Colors.text.primary.dark : Colors.text.primary.light} 
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: darkMode ? Colors.text.primary.dark : Colors.text.primary.light }]}>
          Create Account
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: darkMode ? Colors.background.card.dark : Colors.background.card.light,
              borderColor: darkMode ? Colors.gray600 : Colors.gray300,
              color: darkMode ? Colors.text.primary.dark : Colors.text.primary.light,
            }
          ]}
          placeholder="Name"
          placeholderTextColor={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: darkMode ? Colors.background.card.dark : Colors.background.card.light,
              borderColor: darkMode ? Colors.gray600 : Colors.gray300,
              color: darkMode ? Colors.text.primary.dark : Colors.text.primary.light,
            }
          ]}
          placeholder="Email"
          placeholderTextColor={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: darkMode ? Colors.background.card.dark : Colors.background.card.light,
              borderColor: darkMode ? Colors.gray600 : Colors.gray300,
              color: darkMode ? Colors.text.primary.dark : Colors.text.primary.light,
            }
          ]}
          placeholder="Phone"
          placeholderTextColor={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: darkMode ? Colors.background.card.dark : Colors.background.card.light,
              borderColor: darkMode ? Colors.gray600 : Colors.gray300,
              color: darkMode ? Colors.text.primary.dark : Colors.text.primary.light,
            }
          ]}
          placeholder="Emoji (optional)"
          placeholderTextColor={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
          value={emoji}
          onChangeText={setEmoji}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: darkMode ? Colors.background.card.dark : Colors.background.card.light,
              borderColor: darkMode ? Colors.gray600 : Colors.gray300,
              color: darkMode ? Colors.text.primary.dark : Colors.text.primary.light,
            }
          ]}
          placeholder="Password"
          placeholderTextColor={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[
            styles.signupButton,
            {
              backgroundColor: darkMode ? Colors.text.accent.dark : Colors.primary,
              opacity: loading ? 0.6 : 1,
            }
          ]}
          onPress={handleSignup}
          disabled={loading}
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Text style={[styles.signupButtonText, { color: Colors.white }]}>
            {loading ? "Registering..." : "Sign Up"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  headerTitle: {
    ...Typography.textStyles.h3,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40, // Same as back button width
  },
  content: {
    flex: 1,
    padding: Spacing["2xl"],
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    fontSize: Typography.fontSize.md,
  },
  signupButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  signupButtonText: {
    ...Typography.textStyles.buttonLarge,
    fontWeight: "600",
  },
});
