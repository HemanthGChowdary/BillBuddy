import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Switch,
  Modal,
  Dimensions,
  Pressable, // Import Pressable
  ActionSheetIOS, // For iOS specific action sheet
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker

const { width } = Dimensions.get("window");

export default function ProfileScreen({
  profileName,
  setProfileName,
  profileEmail,
  setProfileEmail,
}) {
  // Existing states
  const [countryCodeValue, setCountryCodeValue] = useState(null);
  const [countryCode, setCountryCode] = useState([
    { label: "🇺🇸 USA (+1)", value: "+1-us" },
    { label: "🇨🇦 Canada (+1)", value: "+1-ca" },
    { label: "🇮🇳 India (+91)", value: "+91" },
    { label: "🇲🇽 Mexico (+52)", value: "+52" },
  ]);
  const [phone, setPhone] = useState("");
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // New states for enhanced features
  const [profileImage, setProfileImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [dataSharing, setDataSharing] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // App preferences
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languages] = useState([
    { label: "🇺🇸 English", value: "en" },
    { label: "🇪🇸 Español", value: "es" },
  ]);

  // Privacy options
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyOptions] = useState([
    { label: "🌐 Public", value: "public" },
    { label: "👥 Friends Only", value: "friends" },
    { label: "🔒 Private", value: "private" },
  ]);

  // Modal states
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showAccountActivity, setShowAccountActivity] = useState(false);

  // Mock account activity data
  const [accountActivity] = useState([
    {
      date: "2025-06-18",
      action: "Login",
      device: "iPhone 15",
      location: "Bensalem, PA",
    },
    {
      date: "2025-06-17",
      action: "Profile Updated",
      device: "MacBook Pro",
      location: "Bensalem, PA",
    },
    {
      date: "2025-06-16",
      action: "Password Changed",
      device: "iPhone 15",
      location: "Bensalem, PA",
    },
  ]);

  // Existing validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name) => {
    return name.trim().length >= 2;
  };

  const validatePhone = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  // New validation functions
  const validatePassword = (password) => {
    return (
      password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    );
  };

  const validatePasswordMatch = (password, confirm) => {
    return password === confirm;
  };

  // Existing handlers
  const handleNameChange = (text) => {
    setProfileName(text);
    if (errors.name && validateName(text)) {
      setErrors((prev) => ({ ...prev, name: null }));
    }
  };

  const handleEmailChange = (text) => {
    setProfileEmail(text);
    if (errors.email && validateEmail(text)) {
      setErrors((prev) => ({ ...prev, email: null }));
    }
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, "");
    let formattedText = cleaned;
    if (cleaned.length > 6) {
      formattedText = `${cleaned.slice(0, 3)}-${cleaned.slice(
        3,
        6
      )}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length > 3) {
      formattedText = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    setPhone(formattedText);
    if (errors.phone && validatePhone(cleaned)) {
      setErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  // Image Picker Functions (Adapted from BillsScreen.js)
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use MediaTypeOptions.Images
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const launchCamera = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || mediaStatus !== "granted") {
      Alert.alert(
        "Permissions Required",
        "Please grant camera and media permissions to use this feature."
      );
      return null;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri); // Set the profile image
      } else {
        return null;
      }
    } catch (error) {
      console.error("Camera launch failed:", error);
      Alert.alert("Error", "Unable to launch camera. Please try again.");
      return null;
    }
  };

  const handleImagePicker = () => {
    const options = {
      mediaType: "photo",
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.7,
      includeBase64: false,
      selectionLimit: 1,
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            launchCamera();
          } else if (buttonIndex === 2) {
            pickImage();
          }
        }
      );
    } else {
      Alert.alert("Add Photo", "Choose an option to add a photo:", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Take Photo",
          onPress: () => {
            launchCamera();
          },
        },
        {
          text: "Choose from Library",
          onPress: () => {
            pickImage(); // Use pickImage for Android library
          },
        },
      ]);
    }
  };

  const handleClearPhoto = () => {
    setProfileImage(null);
  };

  const handlePasswordChange = () => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!validatePassword(newPassword)) {
      newErrors.newPassword =
        "Password must be 8+ characters with uppercase, lowercase, and number";
    }

    if (!validatePasswordMatch(newPassword, confirmPassword)) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      Alert.alert("Success", "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    }
  };

  const handleTwoFactorToggle = (value) => {
    setTwoFactorAuth(value);
    if (value) {
      Alert.alert(
        "Enable Two-Factor Authentication",
        "You'll receive a verification code via SMS when logging in from new devices.",
        [
          { text: "Cancel", onPress: () => setTwoFactorAuth(false) },
          {
            text: "Enable",
            onPress: () =>
              Alert.alert("Success", "Two-factor authentication enabled!"),
          },
        ]
      );
    }
  };

  const handleDataExport = () => {
    Alert.alert(
      "Export Data",
      "Your data will be compiled and sent to your email address within 24 hours.",
      [
        { text: "Cancel" },
        {
          text: "Export",
          onPress: () =>
            Alert.alert("Success", "Data export request submitted!"),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Account Deletion",
              "Account deletion request submitted."
            ),
        },
      ]
    );
  };

  // Enhanced validation
  const validateForm = () => {
    const newErrors = {};

    if (!validateName(profileName)) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    if (!validateEmail(profileEmail)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!validatePhone(phone)) {
      newErrors.phone = "Phone number must be 10-15 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enhanced save profile
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors before saving.");
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert("Success", "Profile updated successfully!", [{ text: "OK" }]);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderError = (error) => {
    if (!error) return null;
    return <Text style={styles.errorText}>{error}</Text>;
  };

  const getDisplayCountryCode = () => {
    if (!countryCodeValue) {
      return countryCode.length > 0 ? countryCode[0].value.split("-")[0] : "";
    }
    return countryCodeValue.includes("-")
      ? countryCodeValue.split("-")[0]
      : countryCodeValue;
  };

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderToggleOption = (title, subtitle, value, onValueChange) => (
    <View style={styles.toggleOption}>
      <View style={styles.toggleTextContainer}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {subtitle && <Text style={styles.toggleSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#ddd", true: "#2356A8" }}
        thumbColor={value ? "#fff" : "#f4f3f4"}
      />
    </View>
  );

  const renderActionButton = (
    title,
    subtitle,
    onPress,
    color = "#2356A8",
    textColor = "#fff"
  ) => (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      <View>
        <Text style={[styles.actionButtonTitle, { color: textColor }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.actionButtonSubtitle,
              { color: textColor, opacity: 0.8 },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Account Settings</Text>
            <Text style={styles.subtitle}>
              Manage your account and preferences
            </Text>
          </View>

          <ScrollView
            style={styles.formScrollView}
            contentContainerStyle={styles.formScrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Profile Photo Upload Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Photo</Text>
              {profileImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.imagePreview}
                  />
                  <Pressable
                    style={styles.clearImageButton}
                    onPress={handleClearPhoto}
                  >
                    <Text style={styles.clearImageButtonText}>Clear Photo</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.imagePickerButton}
                  onPress={handleImagePicker}
                >
                  <Text style={styles.imagePickerButtonText}>
                    🖼️ Upload Profile Picture
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Personal Information */}
            {renderSection(
              "Personal Information",
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    placeholder="Enter your full name"
                    value={profileName}
                    onChangeText={handleNameChange}
                    style={[styles.input, errors.name && styles.inputError]}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  {renderError(errors.name)}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address *</Text>
                  <TextInput
                    placeholder="Enter your email address"
                    value={profileEmail}
                    onChangeText={handleEmailChange}
                    style={[styles.input, errors.email && styles.inputError]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {renderError(errors.email)}
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    { zIndex: countryCodeOpen ? 5000 : 1 },
                  ]}
                >
                  <Text style={styles.label}>Country Code</Text>
                  <DropDownPicker
                    open={countryCodeOpen}
                    value={countryCodeValue}
                    items={countryCode}
                    setOpen={setCountryCodeOpen}
                    setValue={setCountryCodeValue}
                    setItems={setCountryCode}
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    placeholder="Select country code"
                    searchable={false}
                    zIndex={5000}
                    zIndexInverse={1000}
                    listMode="SCROLLVIEW"
                    scrollViewProps={{ nestedScrollEnabled: true }}
                    onOpen={() => setCountryCodeOpen(true)}
                    onClose={() => setCountryCodeOpen(false)}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number *</Text>
                  <View style={styles.phoneContainer}>
                    <Text style={styles.countryCodeDisplay}>
                      {getDisplayCountryCode()}
                    </Text>
                    <TextInput
                      placeholder="Enter phone number"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      style={[
                        styles.phoneInput,
                        errors.phone && styles.inputError,
                      ]}
                      keyboardType="phone-pad"
                      maxLength={12}
                    />
                  </View>
                  {renderError(errors.phone)}
                </View>
              </>
            )}

            {/* Password Section */}
            {renderSection(
              "Security",
              <>
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPasswordSection(!showPasswordSection)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPasswordSection
                      ? "Cancel Password Change"
                      : "Change Password"}
                  </Text>
                </TouchableOpacity>

                {showPasswordSection && (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Current Password *</Text>
                      <TextInput
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        style={[
                          styles.input,
                          errors.currentPassword && styles.inputError,
                        ]}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                      {renderError(errors.currentPassword)}
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>New Password *</Text>
                      <TextInput
                        placeholder="Enter new password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        style={[
                          styles.input,
                          errors.newPassword && styles.inputError,
                        ]}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                      {renderError(errors.newPassword)}
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Confirm New Password *</Text>
                      <TextInput
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        style={[
                          styles.input,
                          errors.confirmPassword && styles.inputError,
                        ]}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                      {renderError(errors.confirmPassword)}
                    </View>

                    <TouchableOpacity
                      style={styles.passwordButton}
                      onPress={handlePasswordChange}
                    >
                      <Text style={styles.passwordButtonText}>
                        Update Password
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {renderToggleOption(
                  "Two-Factor Authentication",
                  "Add an extra layer of security to your account",
                  twoFactorAuth,
                  handleTwoFactorToggle
                )}
              </>
            )}

            {/* Notification Preferences */}
            {renderSection(
              "Notification Preferences",
              <>
                {renderToggleOption(
                  "Email Notifications",
                  "Receive important updates via email",
                  emailNotifications,
                  setEmailNotifications
                )}
                {renderToggleOption(
                  "SMS Notifications",
                  "Receive alerts via text message",
                  smsNotifications,
                  setSmsNotifications
                )}
                {renderToggleOption(
                  "Push Notifications",
                  "Receive push notifications on your device",
                  pushNotifications,
                  setPushNotifications
                )}
                {renderToggleOption(
                  "Marketing Emails",
                  "Receive promotional offers and updates",
                  marketingEmails,
                  setMarketingEmails
                )}
              </>
            )}

            {/* Privacy Settings */}
            {renderSection(
              "Privacy & Visibility",
              <>
                <View
                  style={[
                    styles.inputContainer,
                    { zIndex: privacyOpen ? 4000 : 1 },
                  ]}
                >
                  <Text style={styles.label}>Profile Visibility</Text>
                  <DropDownPicker
                    open={privacyOpen}
                    value={profileVisibility}
                    items={privacyOptions}
                    setOpen={setPrivacyOpen}
                    setValue={setProfileVisibility}
                    setItems={() => {}} // Static items
                    style={styles.dropdown}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      { zIndex: 4000 },
                    ]}
                    textStyle={styles.dropdownText}
                    placeholder="Select privacy level"
                    searchable={false}
                    zIndex={4000}
                    zIndexInverse={1000}
                  />
                </View>

                {renderToggleOption(
                  "Data Sharing",
                  "Allow us to share anonymized data for analytics",
                  dataSharing,
                  setDataSharing
                )}
              </>
            )}

            {/* App Preferences */}
            {renderSection(
              "App Preferences",
              <>
                <View
                  style={[
                    styles.inputContainer,
                    { zIndex: languageOpen ? 3000 : 1 },
                  ]}
                >
                  <Text style={styles.label}>Language</Text>
                  <DropDownPicker
                    open={languageOpen}
                    value={language}
                    items={languages}
                    setOpen={setLanguageOpen}
                    setValue={setLanguage}
                    setItems={() => {}} // Static items
                    style={styles.dropdown}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      { zIndex: 3000 },
                    ]}
                    textStyle={styles.dropdownText}
                    placeholder="Select language"
                    searchable={false}
                    zIndex={3000}
                    zIndexInverse={1000}
                  />
                </View>

                {renderToggleOption(
                  "Dark Mode",
                  "Switch between light and dark theme",
                  darkMode,
                  setDarkMode
                )}
              </>
            )}

            {/* Account Management */}
            {renderSection(
              "Account Management",
              <>
                {renderActionButton(
                  "Account Activity",
                  "View recent login history",
                  () => setShowAccountActivity(true)
                )}
                {renderActionButton(
                  "Export Data",
                  "Download a copy of your data",
                  handleDataExport
                )}
                {renderActionButton(
                  "Contact Support",
                  "Get help with your account",
                  () =>
                    Alert.alert(
                      "Support",
                      "Email: support@example.com\nPhone: 1-800-SUPPORT"
                    )
                )}
                {renderActionButton(
                  "Delete Account",
                  "Permanently delete your account",
                  handleDeleteAccount,
                  "#e74c3c",
                  "#fff"
                )}
              </>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? "Saving..." : "Save Profile"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Image Picker Modal */}
        <Modal
          visible={showImagePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Profile Picture</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handleImagePick("camera")}
              >
                <Text style={styles.modalButtonText}>📷 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handleImagePick("gallery")}
              >
                <Text style={styles.modalButtonText}>
                  🖼️ Choose from Gallery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowImagePicker(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Account Activity Modal */}
        <Modal
          visible={showAccountActivity}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAccountActivity(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.activityModal]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Account Activity</Text>
                <TouchableOpacity
                  onPress={() => setShowAccountActivity(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.activityList}>
                {accountActivity.map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityAction}>
                        {activity.action}
                      </Text>
                      <Text style={styles.activityDetails}>
                        {activity.device} • {activity.location}
                      </Text>
                      <Text style={styles.activityDate}>{activity.date}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFE4D2",
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formScrollView: {
    flex: 1,
  },
  formScrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2356A8",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  // Section Styles
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2356A8",
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#2356A8",
    paddingBottom: 8,
  },

  // Profile Image Styles
  profileImageSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#2356A8",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2356A8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2356A8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  cameraIcon: {
    fontSize: 16,
  },
  profileImageHint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  // Form Styles (existing)
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2356A8",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputError: {
    borderColor: "#e74c3c",
    borderWidth: 2,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },

  // Dropdown Styles (existing)
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    minHeight: 54,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 16,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  countryCodeDisplay: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2356A8",
    paddingLeft: 16,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },

  // Security Section Styles
  passwordToggle: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  passwordToggleText: {
    color: "#2356A8",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  passwordButton: {
    backgroundColor: "#2356A8",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  passwordButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Toggle Option Styles
  toggleOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  toggleSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },

  // Action Button Styles
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "flex-start",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButtonSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  // Save Button Styles
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#CCCCCC",
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2356A8",
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#2356A8",
    borderRadius: 10,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalCancelButton: {
    backgroundColor: "#ddd",
  },
  modalCancelText: {
    color: "#333",
  },

  // Account Activity Modal Specific Styles
  activityModal: {
    maxHeight: "80%",
    paddingHorizontal: 0,
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
  },
  activityList: {
    width: "100%",
    paddingHorizontal: 24,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  activityInfo: {
    flex: 1,
  },
  activityAction: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  activityDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  activityDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  // New styles for photo field (Copied and adapted from BillsScreen.js)
  imagePickerButton: {
    backgroundColor: "#673AB7", // Purple color
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 15,
  },
  imagePickerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  clearImageButton: {
    backgroundColor: "#F44336", // Red color
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  clearImageButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
