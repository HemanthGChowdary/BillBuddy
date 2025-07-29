import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../styles/theme";
import { VALIDATION, ERROR_MESSAGES, SUCCESS_MESSAGES } from "../styles/constants";

const { width } = Dimensions.get('window');

export default function AuthScreen({ onSignIn, onSignUp, darkMode = false }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Forgot Password Modal State
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    emoji: "👤",
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Animation value for form switching
  const [slideAnim] = useState(new Animated.Value(0));

  // Validation functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateName = (name) => name.trim().length >= VALIDATION.MIN_NAME_LENGTH;
  const validateNameLength = (name) => name.trim().length <= VALIDATION.MAX_NAME_LENGTH;
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 15;
  };
  const validatePassword = (password) =>
    password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);

  // Form handlers
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const handlePhoneChange = useCallback((text) => {
    const cleaned = text.replace(/\D/g, "");
    let formattedText = cleaned;
    if (cleaned.length > 6) {
      formattedText = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length > 3) {
      formattedText = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    updateFormData('phone', formattedText);
  }, [updateFormData]);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = ERROR_MESSAGES.INVALID_EMAIL;
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be 8+ characters with uppercase, lowercase, and number";
    }

    if (isSignUp) {
      if (!validateName(formData.name)) {
        newErrors.name = ERROR_MESSAGES.NAME_TOO_SHORT;
      } else if (!validateNameLength(formData.name)) {
        newErrors.name = ERROR_MESSAGES.NAME_TOO_LONG;
      }
      if (!formData.phone || !validatePhone(formData.phone)) {
        newErrors.phone = ERROR_MESSAGES.INVALID_PHONE;
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isSignUp]);

  // Authentication handlers
  const handleSignIn = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (onSignIn) {
        await onSignIn({
          email: formData.email,
          password: formData.password,
        });
      }
      
      Alert.alert("Success", "Welcome back! 🎉");
    } catch (error) {
      Alert.alert("Sign In Failed", error.message || "Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [formData, onSignIn, validateForm]);

  const handleSignUp = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onSignUp) {
        await onSignUp({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          emoji: formData.emoji,
        });
      }
      
      Alert.alert("Success", SUCCESS_MESSAGES.FRIEND_ADDED.replace("Friend", "Account"));
    } catch (error) {
      // Handle special case of recreating account with deleted email
      if (error.message && error.message.startsWith("INFO_DELETED_ACCOUNT_RECREATION:")) {
        const warningMessage = error.message.replace("INFO_DELETED_ACCOUNT_RECREATION: ", "");
        Alert.alert(
          "Account Recreation",
          warningMessage,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Create New Account",
              onPress: async () => {
                try {
                  // Proceed with account creation, bypassing deleted account check
                  if (onSignUp) {
                    await onSignUp({
                      name: formData.name.trim(),
                      email: formData.email.trim().toLowerCase(),
                      phone: formData.phone.trim(),
                      password: formData.password,
                      emoji: formData.emoji,
                    }, true); // bypass deleted check
                  }
                  Alert.alert("Success", "New account created successfully! 🎉");
                } catch (secondError) {
                  Alert.alert("Sign Up Failed", secondError.message || "Please try again.");
                }
              }
            }
          ]
        );
      } else {
        Alert.alert("Sign Up Failed", error.message || "Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, onSignUp, validateForm]);

  // Forgot Password handler
  const handleForgotPassword = useCallback(async () => {
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError("Please enter your email address");
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      setForgotPasswordError(ERROR_MESSAGES.INVALID_EMAIL);
      return;
    }

    setIsResettingPassword(true);
    setForgotPasswordError("");

    try {
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Close modal and show success message
      setShowForgotPasswordModal(false);
      setForgotPasswordEmail("");
      
      Alert.alert(
        "Password Reset Email Sent",
        `We've sent a password reset link to ${forgotPasswordEmail}. Please check your email and follow the instructions to reset your password.`,
        [{ text: "OK" }]
      );
      
    } catch (error) {
      setForgotPasswordError("Failed to send reset email. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  }, [forgotPasswordEmail, validateEmail]);

  // Open forgot password modal
  const openForgotPasswordModal = useCallback(() => {
    setForgotPasswordEmail(formData.email); // Pre-fill with current email if available
    setForgotPasswordError("");
    setShowForgotPasswordModal(true);
  }, [formData.email]);

  // Close forgot password modal
  const closeForgotPasswordModal = useCallback(() => {
    setShowForgotPasswordModal(false);
    setForgotPasswordEmail("");
    setForgotPasswordError("");
  }, []);

  // Toggle between sign in/up
  const toggleAuthMode = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: isSignUp ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setIsSignUp(!isSignUp);
    setErrors({});
    setFormData({
      name: "",
      email: formData.email, // Keep email when switching
      phone: "",
      password: "",
      confirmPassword: "",
      emoji: "👤",
    });
  }, [isSignUp, slideAnim, formData.email]);

  const renderInput = (
    placeholder,
    value,
    onChangeText,
    keyboardType = "default",
    secureTextEntry = false,
    showPasswordToggle = false,
    error = null,
    icon = null
  ) => (
    <View style={styles.inputGroup}>
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: darkMode ? Colors.background.card.dark : Colors.background.card.light,
          borderColor: error 
            ? Colors.error.light 
            : darkMode ? Colors.gray600 : Colors.gray300,
        }
      ]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            { color: darkMode ? Colors.text.primary.dark : Colors.text.primary.light }
          ]}
          placeholder={placeholder}
          placeholderTextColor={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {showPasswordToggle && (
          <Pressable
            style={styles.passwordToggle}
            onPress={() => {
              if (placeholder.includes("Confirm")) {
                setShowConfirmPassword(!showConfirmPassword);
              } else {
                setShowPassword(!showPassword);
              }
            }}
          >
            <Ionicons
              name={secureTextEntry ? "eye-off" : "eye"}
              size={20}
              color={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
            />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? Colors.background.dark : Colors.background.light }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      
      {/* Background gradient */}
      <LinearGradient
        colors={darkMode 
          ? [Colors.background.dark, Colors.gray900, Colors.background.dark]
          : [Colors.background.light, Colors.primaryLight, Colors.background.light]
        }
        style={styles.gradientBackground}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.appName, { color: darkMode ? Colors.text.accent.dark : Colors.primary }]}>
              💰 Bill Buddy
            </Text>
            <Text style={[styles.subtitle, { color: darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light }]}>
              Split bills with friends easily
            </Text>
          </View>

          {/* Auth Form Card */}
          <BlurView intensity={20} tint={darkMode ? "dark" : "light"} style={styles.formCard}>
            <View style={[
              styles.formCardInner,
              { backgroundColor: darkMode ? Colors.background.modal.dark : Colors.background.modal.light }
            ]}>
              {/* Toggle Buttons */}
              <View style={[styles.toggleContainer, { backgroundColor: darkMode ? Colors.gray800 : Colors.gray100 }]}>
                <Pressable
                  style={[
                    styles.toggleButton,
                    !isSignUp && [styles.toggleButtonActive, { backgroundColor: darkMode ? Colors.text.accent.dark : Colors.primary }]
                  ]}
                  onPress={() => !isSignUp ? null : toggleAuthMode()}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: !isSignUp 
                        ? Colors.white 
                        : darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light 
                    }
                  ]}>
                    Sign In
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleButton,
                    isSignUp && [styles.toggleButtonActive, { backgroundColor: darkMode ? Colors.text.accent.dark : Colors.primary }]
                  ]}
                  onPress={() => isSignUp ? null : toggleAuthMode()}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: isSignUp 
                        ? Colors.white 
                        : darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light 
                    }
                  ]}>
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              {/* Form Title */}
              <Text style={[styles.formTitle, { color: darkMode ? Colors.text.primary.dark : Colors.text.primary.light }]}>
                {isSignUp ? "Create Account" : "Welcome Back"}
              </Text>
              <Text style={[styles.formSubtitle, { color: darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light }]}>
                {isSignUp ? "Join Bill Buddy today" : "Sign in to continue"}
              </Text>

              {/* Form Fields */}
              <View style={styles.formFields}>
                {isSignUp && renderInput(
                  "Full Name",
                  formData.name,
                  (text) => updateFormData('name', text),
                  "default",
                  false,
                  false,
                  errors.name,
                  "person"
                )}

                {renderInput(
                  "Email Address",
                  formData.email,
                  (text) => updateFormData('email', text),
                  "email-address",
                  false,
                  false,
                  errors.email,
                  "mail"
                )}

                {isSignUp && renderInput(
                  "Phone Number",
                  formData.phone,
                  handlePhoneChange,
                  "phone-pad",
                  false,
                  false,
                  errors.phone,
                  "call"
                )}

                {renderInput(
                  "Password",
                  formData.password,
                  (text) => updateFormData('password', text),
                  "default",
                  !showPassword,
                  true,
                  errors.password,
                  "lock-closed"
                )}

                {isSignUp && renderInput(
                  "Confirm Password",
                  formData.confirmPassword,
                  (text) => updateFormData('confirmPassword', text),
                  "default",
                  !showConfirmPassword,
                  true,
                  errors.confirmPassword,
                  "lock-closed"
                )}
              </View>

              {/* Submit Button */}
              <Pressable
                style={[
                  styles.submitButton,
                  { 
                    backgroundColor: darkMode ? Colors.text.accent.dark : Colors.primary,
                    opacity: isLoading ? 0.7 : 1,
                  }
                ]}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                disabled={isLoading}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? "Create Account" : "Sign In"}
                  </Text>
                )}
              </Pressable>

              {/* Forgot Password (Sign In only) */}
              {!isSignUp && (
                <Pressable 
                  style={styles.forgotPassword}
                  onPress={openForgotPasswordModal}
                  android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: true }}
                >
                  <Text style={[styles.forgotPasswordText, { color: darkMode ? Colors.text.accent.dark : Colors.primary }]}>
                    Forgot Password?
                  </Text>
                </Pressable>
              )}
            </View>
          </BlurView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: darkMode ? Colors.text.tertiary.dark : Colors.text.tertiary.light }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={closeForgotPasswordModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <BlurView intensity={40} tint={darkMode ? "dark" : "light"} style={styles.modalBlur}>
                  <View style={[
                    styles.modalContent,
                    { backgroundColor: darkMode ? Colors.background.modal.dark : Colors.background.modal.light }
                  ]}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: darkMode ? Colors.text.primary.dark : Colors.text.primary.light }]}>
                        Reset Password
                      </Text>
                      <Pressable
                        style={styles.modalCloseButton}
                        onPress={closeForgotPasswordModal}
                        android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: true }}
                      >
                        <Ionicons
                          name="close"
                          size={24}
                          color={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
                        />
                      </Pressable>
                    </View>

                    {/* Modal Body */}
                    <Text style={[styles.modalDescription, { color: darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light }]}>
                      Enter your email address and we'll send you a link to reset your password.
                    </Text>

                    {/* Email Input */}
                    <View style={styles.modalInputGroup}>
                      <View style={[
                        styles.modalInputContainer,
                        { 
                          backgroundColor: darkMode ? Colors.background.card.dark : Colors.background.card.light,
                          borderColor: forgotPasswordError 
                            ? Colors.error.light 
                            : darkMode ? Colors.gray600 : Colors.gray300,
                        }
                      ]}>
                        <Ionicons 
                          name="mail" 
                          size={20} 
                          color={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
                          style={styles.modalInputIcon}
                        />
                        <TextInput
                          style={[
                            styles.modalInput,
                            { color: darkMode ? Colors.text.primary.dark : Colors.text.primary.light }
                          ]}
                          placeholder="Enter your email address"
                          placeholderTextColor={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
                          value={forgotPasswordEmail}
                          onChangeText={(text) => {
                            setForgotPasswordEmail(text);
                            if (forgotPasswordError) setForgotPasswordError("");
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isResettingPassword}
                        />
                      </View>
                      {forgotPasswordError ? (
                        <Text style={styles.modalErrorText}>{forgotPasswordError}</Text>
                      ) : null}
                    </View>

                    {/* Modal Actions */}
                    <View style={styles.modalActions}>
                      <Pressable
                        style={[styles.modalButton, styles.modalCancelButton, { borderColor: darkMode ? Colors.gray600 : Colors.gray300 }]}
                        onPress={closeForgotPasswordModal}
                        disabled={isResettingPassword}
                        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                      >
                        <Text style={[styles.modalCancelButtonText, { color: darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light }]}>
                          Cancel
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.modalButton,
                          styles.modalSendButton,
                          { 
                            backgroundColor: darkMode ? Colors.text.accent.dark : Colors.primary,
                            opacity: isResettingPassword ? 0.7 : 1,
                          }
                        ]}
                        onPress={handleForgotPassword}
                        disabled={isResettingPassword}
                        android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        {isResettingPassword ? (
                          <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                          <Text style={styles.modalSendButtonText}>
                            Send Reset Link
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </BlurView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing["4xl"],
    paddingBottom: Spacing["2xl"],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing["4xl"],
  },
  appName: {
    ...Typography.textStyles.h1,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.textStyles.body,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: BorderRadius["2xl"],
    overflow: 'hidden',
    ...Shadows.lg,
    marginBottom: Spacing["2xl"],
  },
  formCardInner: {
    padding: Spacing["3xl"],
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing["2xl"],
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  toggleButtonActive: {
    ...Shadows.sm,
  },
  toggleText: {
    ...Typography.textStyles.button,
    fontWeight: '600',
  },
  formTitle: {
    ...Typography.textStyles.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  formSubtitle: {
    ...Typography.textStyles.body,
    textAlign: 'center',
    marginBottom: Spacing["2xl"],
  },
  formFields: {
    marginBottom: Spacing["2xl"],
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.textStyles.body,
    paddingVertical: Spacing.md,
  },
  passwordToggle: {
    padding: Spacing.sm,
  },
  errorText: {
    color: Colors.error.light,
    ...Typography.textStyles.caption,
    marginTop: Spacing.sm,
    marginLeft: Spacing.lg,
  },
  submitButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
    marginBottom: Spacing.lg,
  },
  submitButtonText: {
    ...Typography.textStyles.buttonLarge,
    color: Colors.white,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  forgotPasswordText: {
    ...Typography.textStyles.body,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  footerText: {
    ...Typography.textStyles.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
  },
  modalBlur: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  modalContent: {
    padding: Spacing["3xl"],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.textStyles.h3,
    flex: 1,
  },
  modalCloseButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },
  modalDescription: {
    ...Typography.textStyles.body,
    lineHeight: 22,
    marginBottom: Spacing["2xl"],
  },
  modalInputGroup: {
    marginBottom: Spacing["2xl"],
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
  },
  modalInputIcon: {
    marginRight: Spacing.md,
  },
  modalInput: {
    flex: 1,
    ...Typography.textStyles.body,
    paddingVertical: Spacing.md,
  },
  modalErrorText: {
    color: Colors.error.light,
    ...Typography.textStyles.caption,
    marginTop: Spacing.sm,
    marginLeft: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalCancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  modalCancelButtonText: {
    ...Typography.textStyles.button,
    fontWeight: '500',
  },
  modalSendButton: {
    ...Shadows.sm,
  },
  modalSendButtonText: {
    ...Typography.textStyles.button,
    color: Colors.white,
    fontWeight: '600',
  },
});