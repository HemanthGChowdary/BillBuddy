import { useState, useCallback, useEffect, Component } from "react";
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
  Pressable,
  Linking,
  ActionSheetIOS,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import PropTypes from "prop-types";

function ProfileScreen({
  profileName,
  setProfileName,
  profileEmoji,
  setProfileEmoji,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  darkMode,
  setDarkMode,
  liquidGlassMode,
  setLiquidGlassMode,
  onTabPress, // Function to be called on tab press
}) {
  const insets = useSafeAreaInsets();
  const navigationSpacing = Math.max(insets.bottom, 20) + 10 + 10;

  // Navigation state
  const [currentTab, setCurrentTab] = useState("main"); // main, personal, security, notifications, feedback

  // Note: isSignedIn removed as it was unused

  // Reset to main screen when tab is double-pressed
  useEffect(() => {
    if (onTabPress) {
      onTabPress(() => {
        setCurrentTab("main");
      });
    }
  }, [onTabPress]);

  // Core profile states
  const [countryCodeValue, setCountryCodeValue] = useState("+1-us");
  const [phone, setPhone] = useState(profilePhone || "");
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Security states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // User preferences - load from user data
  const [userSettings, setUserSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  // Load settings and profile data from UserManager on component mount
  useEffect(() => {
    loadUserSettings();
    loadProfileData();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      // For UI testing - check if we have a mock user
      const mockUser = {
        id: "test_user_123",
        name: profileName || "Test User",
        email: profileEmail || "test@example.com",
        phone: phone || "",
        profileImage: profileImage,
      };

      // Only set if we have actual profile data
      if (profileName && profileEmail) {
        setCurrentUser(mockUser);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const loadUserSettings = async () => {
    try {
      // For UI testing - use default settings
      setUserSettings({
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
      });
    } catch (error) {
      // Error handled silently
    }
  };

  const loadProfileData = async () => {
    try {
      // For UI testing - no need to load from UserManager
      // Profile data comes from props
    } catch (error) {
      // Error handled silently
    }
  };

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dropdown states
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const [countryCode] = useState([
    { label: "🇺🇸 United States (+1)", value: "+1-us" },
    { label: "🇮🇳 India (+91)", value: "+91" },
    { label: "🇨🇦 Canada (+1)", value: "+1-ca" },
    { label: "🇲🇽 Mexico (+52)", value: "+52" },
  ]);

  // Validation functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateName = (name) => name.trim().length >= 2;
  const validateFullNameLength = (name) => name.trim().length <= 20;
  const validatePhone = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 15;
  };
  const validatePassword = (password) =>
    password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);

  // Input handlers with real-time validation
  const handleNameChange = useCallback(
    (text) => {
      setProfileName(text);
      if (errors.name && validateName(text) && validateFullNameLength(text)) {
        setErrors((prev) => ({ ...prev, name: null }));
      }
    },
    [errors.name, setProfileName]
  );

  const handleEmailChange = useCallback(
    (text) => {
      setProfileEmail(text);
      if (errors.email && validateEmail(text)) {
        setErrors((prev) => ({ ...prev, email: null }));
      }
    },
    [errors.email, setProfileEmail]
  );

  const handlePhoneChange = useCallback(
    (text) => {
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
    },
    [errors.phone]
  );

  // Image handling
  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || mediaStatus !== "granted") {
      Alert.alert(
        "Permissions Required",
        "Camera and photo library access are needed to update your profile picture."
      );
      return false;
    }
    return true;
  };

  const launchCamera = async () => {
    if (!(await requestPermissions())) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await saveProfileImage(imageUri);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to access camera. Please try again.");
    }
  };

  const pickImage = async () => {
    if (!(await requestPermissions())) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await saveProfileImage(imageUri);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to access photo library. Please try again.");
    }
  };

  const handleImagePicker = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            "Cancel",
            "Take Photo",
            "Choose from Library",
            "Remove Photo",
          ],
          cancelButtonIndex: 0,
          destructiveButtonIndex: profileImage ? 3 : -1,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) launchCamera();
          else if (buttonIndex === 2) pickImage();
          else if (buttonIndex === 3) {
            setProfileImage(null);
            saveProfileImage(null);
          }
        }
      );
    } else {
      const options = [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: launchCamera },
        { text: "Choose from Library", onPress: pickImage },
      ];

      if (profileImage) {
        options.push({
          text: "Remove Photo",
          onPress: async () => {
            setProfileImage(null);
            await saveProfileImage(null);
          },
          style: "destructive",
        });
      }

      Alert.alert("Profile Picture", "Choose an option:", options);
    }
  }, [profileImage]);

  const saveProfileImage = async (imageUri) => {
    try {
      // For UI testing - just save to local state
      setProfileImage(imageUri);
    } catch (error) {
      // Error handled silently
    }
  };

  // Sign in handler for UI testing
  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      // For UI testing - simulate sign in
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock user data for UI testing
      const mockUser = {
        id: "test_user_123",
        name: profileName || "Test User",
        email: profileEmail || "test@example.com",
        phone: phone || "+1-555-0123",
        profileImage: profileImage,
      };

      setCurrentUser(mockUser);
      Alert.alert("Success", "Signed in successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profileName, profileEmail, phone, profileImage]);

  // Two-factor authentication handler
  const handleTwoFactorToggle = useCallback((value) => {
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
    } else {
      Alert.alert(
        "Disable Two-Factor Authentication",
        "Are you sure you want to disable this security feature?",
        [
          { text: "Cancel", onPress: () => setTwoFactorAuth(true) },
          {
            text: "Disable",
            style: "destructive",
            onPress: () =>
              Alert.alert(
                "Disabled",
                "Two-factor authentication has been disabled."
              ),
          },
        ]
      );
    }
  }, []);

  // Password change handler
  const handlePasswordChange = useCallback(async () => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!validatePassword(newPassword)) {
      newErrors.newPassword =
        "Password must be 8+ characters with uppercase, lowercase, and number";
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        // For UI testing - simulate password update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
        Alert.alert("Success", "Password updated successfully!");
        goBack();
      } catch (error) {
        Alert.alert("Error", "Failed to update password. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentPassword, newPassword, confirmPassword]);

  // Authentication handlers - UI only for now
  const handleSignOut = useCallback(async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoading(true);
            // For UI testing - simulate sign out
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setCurrentUser(null);
            Alert.alert("Signed Out", "You have been signed out successfully.");
            // Reset all profile states
            setProfileName("");
            setProfileEmail("");
            setPhone("");
            setProfileImage(null);
          } catch (error) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              // For UI testing - simulate account deletion
              await new Promise((resolve) => setTimeout(resolve, 1000));
              setCurrentUser(null);
              Alert.alert(
                "Account Deleted",
                "Your account has been permanently deleted.",
                [{ text: "OK" }]
              );
              // Reset all profile states
              setProfileName("");
              setProfileEmail("");
              setPhone("");
              setProfileImage(null);
              setErrors({});
            } catch (error) {
              Alert.alert("Error", "An unexpected error occurred.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, []);

  // Feedback handlers
  const handleRateApp = useCallback(() => {
    Alert.alert(
      "Rate BillBuddy",
      "Help us improve by rating BillBuddy on the app store!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rate Now",
          onPress: () => {
            // In a real app, this would open the app store
            const appStoreUrl =
              Platform.OS === "ios"
                ? "https://apps.apple.com/app/billbuddy"
                : "https://play.google.com/store/apps/details?id=com.billbuddy";

            Linking.openURL(appStoreUrl).catch(() => {
              Alert.alert("Success", "Thank you for your feedback! ⭐⭐⭐⭐⭐");
            });
          },
        },
      ]
    );
  }, []);

  const handleContactUs = useCallback(() => {
    Alert.alert(
      "Contact Us",
      "How would you like to contact our support team?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Email",
          onPress: () => {
            const emailUrl =
              "mailto:support@billbuddy.com?subject=App Support Request";
            Linking.openURL(emailUrl).catch(() => {
              Alert.alert("Info", "Please email us at: support@billbuddy.com");
            });
          },
        },
        {
          text: "Phone",
          onPress: () => {
            const phoneUrl = "tel:+1-800-BILLBUDDY";
            Linking.openURL(phoneUrl).catch(() => {
              Alert.alert("Info", "Please call us at: 1-800-BILLBUDDY");
            });
          },
        },
      ]
    );
  }, []);

  // Form validation and save - now using UserManager
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!validateName(profileName)) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (!validateFullNameLength(profileName)) {
      newErrors.name = "Name must be at most 20 characters";
    }
    if (!validateEmail(profileEmail)) {
      newErrors.email = "Please enter a valid email address";
    }
    // Phone is mandatory
    if (!phone || !phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profileName, profileEmail, phone]);

  const handleSaveProfile = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors before saving.");
      return;
    }

    setIsLoading(true);

    try {
      // For UI testing - simulate profile save
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update parent component states
      setProfileName(profileName.trim());
      setProfileEmail(profileEmail.trim().toLowerCase());
      setProfilePhone(phone.trim());

      // Update local currentUser state if exists
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          name: profileName.trim(),
          email: profileEmail.trim().toLowerCase(),
          phone: phone.trim(),
          profileImage: profileImage,
        });
      }

      Alert.alert("Success", "Profile updated successfully!");
      goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [
    validateForm,
    profileName,
    profileEmail,
    phone,
    profileImage,
    currentUser,
    setProfileName,
    setProfileEmail,
    setProfilePhone,
  ]);

  // Settings handlers
  const updateUserSetting = useCallback(
    async (setting, value) => {
      try {
        const newSettings = { ...userSettings, [setting]: value };
        setUserSettings(newSettings);

        // For UI testing - just update local state
      } catch (error) {
        // Error handled silently
        // Revert the local state if save failed
        setUserSettings(userSettings);
      }
    },
    [userSettings]
  );

  // Performance optimization: memoize expensive calculations
  const getDisplayCountryCode = useCallback(() => {
    return countryCodeValue?.includes("-")
      ? countryCodeValue.split("-")[0]
      : countryCodeValue || "+1";
  }, [countryCodeValue]);

  const getInitials = useCallback(() => {
    if (!profileName || !profileName.trim()) {
      return "U";
    }
    const names = profileName.trim().split(" ");
    return (
      names
        .map((name) => name[0]?.toUpperCase())
        .join("")
        .slice(0, 2) || "U"
    );
  }, [profileName]);

  const getWelcomeMessage = useCallback(() => {
    if (!profileName || !profileName.trim()) {
      return "Welcome! 👋";
    }
    const firstName = profileName.trim().split(" ")[0] || "User";
    const emoji = profileEmoji || "👤";
    return `${emoji} Hello, ${firstName}! 👋`;
  }, [profileName, profileEmoji]);

  // Navigation functions
  const goToPersonal = () => setCurrentTab("personal");
  const goToSecurity = () => setCurrentTab("security");
  const goToNotifications = () => setCurrentTab("notifications");
  const goToFeedback = () => setCurrentTab("feedback");
  const goBack = () => setCurrentTab("main");

  // Render different screens based on current tab
  const renderMainScreen = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.darkTitleText]}>
          Profile Screen
        </Text>
        <Text style={[styles.subtitle, darkMode && styles.darkSubtext]}>
          {currentUser
            ? "Manage your account information"
            : "Please sign in to manage your profile"}
        </Text>
      </View>

      {/* Profile Picture Section */}
      <View style={styles.profileSection}>
        <Pressable
          onPress={handleImagePicker}
          style={styles.profileImageContainer}
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
          accessibilityHint="Tap to select a new profile picture from camera or gallery"
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View
              style={[
                styles.profileImagePlaceholder,
                darkMode && styles.darkPlaceholder,
              ]}
            >
              <Text style={styles.profileImageText}>{getInitials()}</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraEmoji}>📷</Text>
          </View>
        </Pressable>
        <Text style={[styles.profileImageHint, darkMode && styles.darkSubtext]}>
          Tap to change profile picture
        </Text>
      </View>

      {/* Welcome Message */}
      <Text
        style={[styles.welcomeMessage, darkMode && styles.darkWelcomeMessage]}
      >
        {getWelcomeMessage()}
      </Text>

      {/* Navigation Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={[styles.menuItem, darkMode && styles.darkMenuitem]}
          onPress={goToPersonal}
          accessibilityRole="button"
          accessibilityLabel="Personal Information"
          accessibilityHint="Tap to edit your name, email, and phone number"
        >
          <View style={styles.menuIconContainer}>
            <Text style={styles.menuIcon}>👤</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, darkMode && styles.darkText]}>
              Personal Information
            </Text>
            <Text style={[styles.menuSubtitle, darkMode && styles.darkSubtext]}>
              Name, email, phone number
            </Text>
          </View>
          <Text style={[styles.chevron, darkMode && styles.darkText]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, darkMode && styles.darkMenuitem]}
          onPress={goToSecurity}
          accessibilityRole="button"
          accessibilityLabel="Security & Privacy"
          accessibilityHint="Tap to change password and security settings"
        >
          <View style={styles.menuIconContainer}>
            <Text style={styles.menuIcon}>🔒</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, darkMode && styles.darkText]}>
              Security & Privacy
            </Text>
            <Text style={[styles.menuSubtitle, darkMode && styles.darkSubtext]}>
              Password, two-factor authentication
            </Text>
          </View>
          <Text style={[styles.chevron, darkMode && styles.darkText]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, darkMode && styles.darkMenuitem]}
          onPress={goToNotifications}
          accessibilityRole="button"
          accessibilityLabel="Notifications & Preferences"
          accessibilityHint="Tap to manage notification settings and app preferences"
        >
          <View style={styles.menuIconContainer}>
            <Text style={styles.menuIcon}>🔔</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, darkMode && styles.darkText]}>
              Notifications & Preferences
            </Text>
            <Text style={[styles.menuSubtitle, darkMode && styles.darkSubtext]}>
              Email, SMS, push notifications, appearance
            </Text>
          </View>
          <Text style={[styles.chevron, darkMode && styles.darkText]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* {Feedback Section} */}
      <TouchableOpacity
        style={[styles.menuItem, darkMode && styles.darkMenuitem]}
        onPress={goToFeedback}
        accessibilityRole="button"
        accessibilityLabel="Feedback & Support"
        accessibilityHint="Tap to rate the app or contact support"
      >
        <View style={styles.menuIconContainer}>
          <Text style={styles.menuIcon}>💬</Text>
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, darkMode && styles.darkText]}>
            Feedback & Support
          </Text>
          <Text style={[styles.menuSubtitle, darkMode && styles.darkSubtext]}>
            Rate app, contact us, help center
          </Text>
        </View>
        <Text style={[styles.chevron, darkMode && styles.darkText]}>›</Text>
      </TouchableOpacity>

      {/* Authentication Section */}
      <View style={styles.authSection}>
        {currentUser ? (
          <TouchableOpacity
            style={[
              styles.authButton,
              styles.signOutButton,
              isLoading && styles.saveButtonDisabled,
            ]}
            onPress={handleSignOut}
            disabled={isLoading}
          >
            <Text style={styles.signOutButtonText}>
              {isLoading ? "Signing Out..." : "🚪 Sign Out"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.authButton,
              styles.signInButton,
              isLoading && styles.saveButtonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            <Text style={styles.signInButtonText}>
              {isLoading ? "Signing In..." : "🔑 Sign In"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderPersonalScreen = () => (
    <>
      {/* Header with Back Button */}
      <View style={styles.subHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to main profile screen"
        >
          <View style={styles.chevronCircle}>
            <Ionicons
              name="chevron-back-circle-outline"
              size={30}
              color={darkMode ? "#D69E2E" : "#8B4513"}
              style={{ marginTop: 5 }}
            />
          </View>
        </TouchableOpacity>
        <Text style={[styles.subTitle, darkMode && styles.darkSubTitle]}>
          Personal Information
        </Text>
      </View>

      <View
        style={[styles.formContainer, darkMode && styles.darkFormContainer]}
      >
        <View style={styles.inputGroup}>
          <Text style={[styles.label, darkMode && styles.darkText]}>
            Full Name *
          </Text>
          <TextInput
            placeholder="Enter your full name"
            placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
            value={profileName}
            onChangeText={handleNameChange}
            style={[
              styles.input,
              darkMode && styles.darkInput,
              errors.name && styles.inputError,
            ]}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, darkMode && styles.darkText]}>
            Email Address *
          </Text>
          <TextInput
            placeholder="Enter your email address"
            placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
            value={profileEmail}
            onChangeText={handleEmailChange}
            style={[
              styles.input,
              darkMode && styles.darkInput,
              errors.email && styles.inputError,
            ]}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View
          style={[styles.inputGroup, { zIndex: countryCodeOpen ? 1000 : 1 }]}
        >
          <Text style={[styles.label, darkMode && styles.darkText]}>
            Country Code
          </Text>
          <DropDownPicker
            open={countryCodeOpen}
            value={countryCodeValue}
            items={countryCode}
            setOpen={setCountryCodeOpen}
            setValue={setCountryCodeValue}
            setItems={() => {}}
            onOpen={() => setCountryCodeOpen(true)}
            onClose={() => setCountryCodeOpen(false)}
            style={[styles.dropdown, darkMode && styles.darkDropdown]}
            dropDownContainerStyle={[
              styles.dropdownContainer,
              darkMode && styles.darkDropdownContainer,
            ]}
            textStyle={[styles.dropdownText, darkMode && styles.darkText]}
            placeholderStyle={[
              styles.dropdownPlaceholder,
              darkMode && styles.darkText,
            ]}
            arrowIconStyle={[
              styles.dropdownArrow,
              darkMode && styles.darkDropdownArrow,
            ]}
            tickIconStyle={[
              styles.dropdownTick,
              darkMode && styles.darkDropdownTick,
            ]}
            placeholder="Select country code"
            searchable={true}
            searchPlaceholder="Search countries..."
            searchTextInputStyle={[
              styles.searchInput,
              darkMode && styles.darkSearchInput,
            ]}
            searchContainerStyle={[
              styles.searchContainer,
              darkMode && styles.darkSearchContainer,
            ]}
            listMode="SCROLLVIEW"
            scrollViewProps={{
              nestedScrollEnabled: true,
              showsVerticalScrollIndicator: true,
              bounces: true,
              decelerationRate: "fast",
            }}
            maxHeight={200}
            itemSeparator={false}
            dropDownDirection="AUTO"
            zIndex={1000}
            zIndexInverse={1000}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, darkMode && styles.darkText]}>
            Phone Number *
          </Text>
          <View style={[styles.phoneContainer, darkMode && styles.darkInput]}>
            <Text
              style={[styles.countryCodeDisplay, darkMode && styles.darkText]}
            >
              {getDisplayCountryCode()}
            </Text>
            <TextInput
              placeholder="Enter phone number"
              placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
              value={phone}
              onChangeText={handlePhoneChange}
              style={[
                styles.phoneInput,
                darkMode && styles.darkText,
                errors.phone && styles.inputError,
              ]}
              keyboardType="phone-pad"
              maxLength={12}
            />
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            darkMode && styles.darkSaveButton,
            isLoading && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveProfile}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.saveButtonText,
              darkMode && styles.darkSaveButtonText,
            ]}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSecurityScreen = () => (
    <>
      {/* Header with Back Button */}
      <View style={styles.subHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to main profile screen"
        >
          <View style={styles.chevronCircle}>
            <Ionicons
              name="chevron-back-circle-outline"
              size={30}
              color={darkMode ? "#D69E2E" : "#8B4513"}
              style={{ marginTop: 5 }}
            />
          </View>
        </TouchableOpacity>
        <Text style={[styles.subTitle, darkMode && styles.darkSubTitle]}>
          Security & Privacy
        </Text>
      </View>

      <View
        style={[styles.formContainer, darkMode && styles.darkFormContainer]}
      >
        {/* Two-Factor Authentication */}
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={[styles.preferenceTitle, darkMode && styles.darkText]}>
              Two-Factor Authentication
            </Text>
            <Text
              style={[
                styles.preferenceSubtitle,
                darkMode && styles.darkSubtext,
              ]}
            >
              Add an extra layer of security to your account
            </Text>
          </View>
          <Switch
            value={twoFactorAuth}
            onValueChange={handleTwoFactorToggle}
            trackColor={{
              false: "#ddd",
              true: darkMode ? "#D69E2E" : "#8B4513",
            }}
            thumbColor="#fff"
          />
        </View>

        {/* Password Change Section */}
        <View style={styles.passwordSection}>
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <Text
              style={[
                styles.passwordToggleText,
                darkMode && { color: "#D69E2E" },
              ]}
            >
              {showPasswordSection
                ? "Cancel Password Change"
                : "Change Password"}
            </Text>
          </TouchableOpacity>

          {showPasswordSection && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, darkMode && styles.darkText]}>
                  Current Password *
                </Text>
                <View
                  style={[
                    styles.passwordInputContainer,
                    darkMode && styles.darkInput,
                  ]}
                >
                  <TextInput
                    placeholder="Enter current password"
                    placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    style={[
                      styles.passwordInput,
                      darkMode && styles.darkText,
                      errors.currentPassword && styles.inputError,
                    ]}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Text style={styles.eyeIconText}>
                      {showCurrentPassword ? "🙈" : "👁️"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.currentPassword && (
                  <Text style={styles.errorText}>{errors.currentPassword}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, darkMode && styles.darkText]}>
                  New Password *
                </Text>
                <View
                  style={[
                    styles.passwordInputContainer,
                    darkMode && styles.darkInput,
                  ]}
                >
                  <TextInput
                    placeholder="Enter new password"
                    placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={[
                      styles.passwordInput,
                      darkMode && styles.darkText,
                      errors.newPassword && styles.inputError,
                    ]}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Text style={styles.eyeIconText}>
                      {showNewPassword ? "🙈" : "👁️"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.newPassword && (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, darkMode && styles.darkText]}>
                  Confirm New Password *
                </Text>
                <View
                  style={[
                    styles.passwordInputContainer,
                    darkMode && styles.darkInput,
                  ]}
                >
                  <TextInput
                    placeholder="Confirm new password"
                    placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={[
                      styles.passwordInput,
                      darkMode && styles.darkText,
                      errors.confirmPassword && styles.inputError,
                    ]}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeIconText}>
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.passwordButton,
                  darkMode && { backgroundColor: "#D69E2E" },
                  isLoading && styles.saveButtonDisabled,
                ]}
                onPress={handlePasswordChange}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.passwordButtonText,
                    darkMode && styles.darkPasswordButtonText,
                  ]}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </>
  );

  const renderNotificationsScreen = () => (
    <>
      {/* Header with Back Button */}
      <View style={styles.subHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to main profile screen"
        >
          <View style={styles.chevronCircle}>
            <Ionicons
              name="chevron-back-circle-outline"
              size={30}
              color={darkMode ? "#D69E2E" : "#8B4513"}
              style={{ marginTop: 5 }}
            />
          </View>
        </TouchableOpacity>
        <Text style={[styles.subTitle, darkMode && styles.darkSubTitle]}>
          Notifications & Preferences
        </Text>
      </View>

      {/* Notifications Container */}
      <View
        style={[styles.formContainer, darkMode && styles.darkFormContainer]}
      >
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={[styles.preferenceTitle, darkMode && styles.darkText]}>
              Email Notifications
            </Text>
            <Text
              style={[
                styles.preferenceSubtitle,
                darkMode && styles.darkSubtext,
              ]}
            >
              Receive important updates via email
            </Text>
          </View>
          <Switch
            value={userSettings.emailNotifications}
            onValueChange={(value) =>
              updateUserSetting("emailNotifications", value)
            }
            trackColor={{
              false: "#ddd",
              true: darkMode ? "#D69E2E" : "#8B4513",
            }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={[styles.preferenceTitle, darkMode && styles.darkText]}>
              SMS Notifications
            </Text>
            <Text
              style={[
                styles.preferenceSubtitle,
                darkMode && styles.darkSubtext,
              ]}
            >
              Receive alerts via text message to your phone
            </Text>
          </View>
          <Switch
            value={userSettings.smsNotifications}
            onValueChange={(value) =>
              updateUserSetting("smsNotifications", value)
            }
            trackColor={{
              false: "#ddd",
              true: darkMode ? "#D69E2E" : "#8B4513",
            }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={[styles.preferenceTitle, darkMode && styles.darkText]}>
              Push Notifications
            </Text>
            <Text
              style={[
                styles.preferenceSubtitle,
                darkMode && styles.darkSubtext,
              ]}
            >
              Receive alerts on your device
            </Text>
          </View>
          <Switch
            value={userSettings.pushNotifications}
            onValueChange={(value) =>
              updateUserSetting("pushNotifications", value)
            }
            trackColor={{
              false: "#ddd",
              true: darkMode ? "#D69E2E" : "#8B4513",
            }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Appearance Settings Container */}
      <View
        style={[
          styles.formContainer,
          darkMode && styles.darkFormContainer,
          { marginTop: 20 },
        ]}
      >
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={[styles.preferenceTitle, darkMode && styles.darkText]}>
              Dark Mode
            </Text>
            <Text
              style={[
                styles.preferenceSubtitle,
                darkMode && styles.darkSubtext,
              ]}
            >
              Use dark theme for better viewing
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{
              false: "#ddd",
              true: darkMode ? "#D69E2E" : "#8B4513",
            }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={[styles.preferenceTitle, darkMode && styles.darkText]}>
              Liquid Glass Mode
            </Text>
            <Text
              style={[
                styles.preferenceSubtitle,
                darkMode && styles.darkSubtext,
              ]}
            >
              Modern frosted glass interface design
            </Text>
          </View>
          <Switch
            value={liquidGlassMode}
            onValueChange={setLiquidGlassMode}
            trackColor={{
              false: "#ddd",
              true: darkMode ? "#D69E2E" : "#8B4513",
            }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </>
  );

  const renderFeedbackScreen = () => (
    <>
      {/* Header with Back Button */}
      <View style={styles.subHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to main profile screen"
        >
          <View style={styles.chevronCircle}>
            <Ionicons
              name="chevron-back-circle-outline"
              size={30}
              color={darkMode ? "#D69E2E" : "#8B4513"}
              style={{ marginTop: 5 }}
            />
          </View>
        </TouchableOpacity>
        <Text style={[styles.subTitle, darkMode && styles.darkSubTitle]}>
          Feedback & Support
        </Text>
      </View>

      <View
        style={[styles.formContainer, darkMode && styles.darkFormContainer]}
      >
        {/* Rate BillBuddy */}
        <TouchableOpacity
          style={[styles.feedbackOption, darkMode && styles.darkFeedbackOption]}
          onPress={handleRateApp}
        >
          <View
            style={[
              styles.feedbackIconContainer,
              darkMode && styles.darkFeedbackIconContainer,
            ]}
          >
            <Text style={styles.feedbackIcon}>⭐</Text>
          </View>
          <View style={styles.feedbackTextContainer}>
            <Text style={[styles.feedbackTitle, darkMode && styles.darkText]}>
              Rate BillBuddy
            </Text>
            <Text
              style={[styles.feedbackSubtitle, darkMode && styles.darkSubtext]}
            >
              Help us improve by rating our app
            </Text>
          </View>
          <Text style={[styles.chevron, darkMode && styles.darkText]}>›</Text>
        </TouchableOpacity>

        {/* Contact Us */}
        <TouchableOpacity
          style={[styles.feedbackOption, darkMode && styles.darkFeedbackOption]}
          onPress={handleContactUs}
        >
          <View
            style={[
              styles.feedbackIconContainer,
              darkMode && styles.darkFeedbackIconContainer,
            ]}
          >
            <Text style={styles.feedbackIcon}>📞</Text>
          </View>
          <View style={styles.feedbackTextContainer}>
            <Text style={[styles.feedbackTitle, darkMode && styles.darkText]}>
              Contact Us
            </Text>
            <Text
              style={[styles.feedbackSubtitle, darkMode && styles.darkSubtext]}
            >
              Get help from our support team
            </Text>
          </View>
          <Text style={[styles.chevron, darkMode && styles.darkText]}>›</Text>
        </TouchableOpacity>

        {/* Help Center */}
        <TouchableOpacity
          style={[styles.feedbackOption, darkMode && styles.darkFeedbackOption]}
          onPress={() =>
            Alert.alert(
              "Help Center",
              "Visit our help center for FAQs and tutorials."
            )
          }
        >
          <View
            style={[
              styles.feedbackIconContainer,
              darkMode && styles.darkFeedbackIconContainer,
            ]}
          >
            <Text style={styles.feedbackIcon}>❓</Text>
          </View>
          <View style={styles.feedbackTextContainer}>
            <Text style={[styles.feedbackTitle, darkMode && styles.darkText]}>
              Help Center
            </Text>
            <Text
              style={[styles.feedbackSubtitle, darkMode && styles.darkSubtext]}
            >
              FAQs, tutorials, and guides
            </Text>
          </View>
          <Text style={[styles.chevron, darkMode && styles.darkText]}>›</Text>
        </TouchableOpacity>

        {/* Bug Report */}
        <TouchableOpacity
          style={[styles.feedbackOption, darkMode && styles.darkFeedbackOption]}
          onPress={() =>
            Alert.alert(
              "Bug Report",
              "Found a bug? Let us know and we'll fix it quickly!"
            )
          }
        >
          <View
            style={[
              styles.feedbackIconContainer,
              darkMode && styles.darkFeedbackIconContainer,
            ]}
          >
            <Text style={styles.feedbackIcon}>🐛</Text>
          </View>
          <View style={styles.feedbackTextContainer}>
            <Text style={[styles.feedbackTitle, darkMode && styles.darkText]}>
              Report a Bug
            </Text>
            <Text
              style={[styles.feedbackSubtitle, darkMode && styles.darkSubtext]}
            >
              Let us know about any issues
            </Text>
          </View>
          <Text style={[styles.chevron, darkMode && styles.darkText]}>›</Text>
        </TouchableOpacity>
      </View>
      {/* Add this after the </View> that closes formContainer */}
      <TouchableOpacity
        style={[styles.authButton, styles.deleteAccountButton]}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.deleteAccountButtonText}>🗑️ Delete Account</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={darkMode ? "#1A202C" : "#EFE4D2"}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: navigationSpacing },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {currentTab === "main" && renderMainScreen()}
          {currentTab === "personal" && renderPersonalScreen()}
          {currentTab === "security" && renderSecurityScreen()}
          {currentTab === "notifications" && renderNotificationsScreen()}
          {currentTab === "feedback" && renderFeedbackScreen()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFE4D2",
  },
  darkContainer: {
    backgroundColor: "#1A1A1A",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#8B4513", // Brown theme from Bills screen
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },

  // Sub Headers
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  chevronCircle: {
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: "center",
    display: "flex",
    alignItems: "center",
  },

  chevronText: {
    fontSize: 18,
    color: "#8B4513",
    fontWeight: "bold",
  },

  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "600",
  },
  subTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B4513",
    textAlign: "center",
    flex: 1,
  },
  darkSubTitle: {
    color: "#D69E2E", // Gold color for dark mode
  },

  // Profile Picture
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profileImage: {
    width: 125,
    height: 125,
    borderRadius: 75,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#8B4513",
  },
  profileImagePlaceholder: {
    width: 125,
    height: 125,
    borderRadius: 75,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    bottom: 8,
    borderColor: "#fff",
  },
  darkPlaceholder: {
    backgroundColor: "#4A5568",
  },
  profileImageText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    alignContent: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cameraEmoji: {
    fontSize: 14,
  },
  profileImageHint: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  // Menu Items
  menuContainer: {
    marginBottom: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    bottom: 5,
  },
  darkMenuitem: {
    backgroundColor: "#2D3748",
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  chevron: {
    fontSize: 24,
    color: "#9CA3AF",
    fontWeight: "300",
  },

  // Form Container
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkFormContainer: {
    backgroundColor: "#2D3748",
  },

  // Form Elements
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#374151",
  },
  darkInput: {
    backgroundColor: "#2D3748",
    borderColor: "#4A5568",
    color: "#E2E8F0",
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },

  // Phone Input
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  countryCodeDisplay: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    paddingLeft: 16,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#374151",
  },

  // Dropdown
  dropdown: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    minHeight: 54,
  },
  darkDropdown: {
    backgroundColor: "#2D3748",
    borderColor: "#4A5568",
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  darkDropdownContainer: {
    backgroundColor: "#2D3748",
    borderColor: "#4A5568",
  },
  dropdownText: {
    fontSize: 16,
    color: "#374151",
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
    color: "#374151",
  },
  darkSearchInput: {
    backgroundColor: "#1A202C",
    borderColor: "#4A5568",
    color: "#E2E8F0",
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  darkSearchContainer: {
    backgroundColor: "#2D3748",
    borderBottomColor: "#4A5568",
  },

  // Dropdown arrows and ticks
  dropdownArrow: {
    tintColor: "#8B4513",
  },
  darkDropdownArrow: {
    tintColor: "#D69E2E",
  },
  dropdownTick: {
    tintColor: "#8B4513",
  },
  darkDropdownTick: {
    tintColor: "#D69E2E",
  },

  // Password Section
  passwordSection: {
    marginTop: 16,
  },
  passwordToggle: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 8,
  },
  passwordToggleText: {
    color: "#8B4513",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#374151",
  },
  eyeIcon: {
    padding: 16,
    paddingLeft: 12,
  },
  eyeIconText: {
    fontSize: 18,
  },
  passwordButton: {
    backgroundColor: "#8B4513",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  passwordButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  darkPasswordButtonText: {
    color: "#fff",
  },

  // Preferences
  preferenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Save Button
  saveButton: {
    backgroundColor: "#8B4513", // Brown theme for consistency
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    bottom: 10,
  },
  darkSaveButton: {
    backgroundColor: "#D69E2E", // Gold theme for dark mode
    shadowColor: "#D69E2E",
  },
  saveButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  darkSaveButtonText: {
    color: "#fff", // Keep white text for readability on gold background
  },

  // Authentication Buttons
  authSection: {
    marginTop: 50,
  },
  authButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  signInButton: {
    backgroundColor: "#007AFF",
    bottom: 45,
  },
  signOutButton: {
    backgroundColor: "#EF4444",
    bottom: 45,
  },
  signInButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  signOutButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },

  // Dark mode text
  darkText: {
    color: "#FFFFFF", // Pure white for maximum contrast
  },
  darkTitleText: {
    color: "#D69E2E", // Gold color for headers in dark mode
  },
  darkSubtext: {
    color: "#CBD5E0",
  },

  welcomeMessage: {
    fontSize: 20,
    fontWeight: "600",
    color: "#8B4513",
    marginBottom: 20,
    marginTop: -20,
    marginLeft: 10,
    textAlign: "center",
  },
  darkWelcomeMessage: {
    color: "#D69E2E", // Gold color for welcome message in dark mode
  },

  // Feedback Options
  feedbackOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  darkFeedbackOption: {
    backgroundColor: "#1A202C",
    borderColor: "#4A5568",
  },
  feedbackIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  darkFeedbackIconContainer: {
    backgroundColor: "#D69E2E",
  },
  feedbackIcon: {
    fontSize: 24,
  },
  feedbackTextContainer: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  feedbackSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Replace the delete account styles with these
  deleteAccountButton: {
    backgroundColor: "#EF4444",
    marginTop: 20,
  },
  deleteAccountButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },

  // Delete button styles for main screen
  deleteButton: {
    backgroundColor: "#EF4444",
    marginTop: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

// PropTypes for type safety
ProfileScreen.propTypes = {
  profileName: PropTypes.string.isRequired,
  setProfileName: PropTypes.func.isRequired,
  profileEmoji: PropTypes.string,
  setProfileEmoji: PropTypes.func.isRequired,
  profileEmail: PropTypes.string.isRequired,
  setProfileEmail: PropTypes.func.isRequired,
  profilePhone: PropTypes.string,
  setProfilePhone: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired,
  setDarkMode: PropTypes.func.isRequired,
  liquidGlassMode: PropTypes.bool.isRequired,
  setLiquidGlassMode: PropTypes.func.isRequired,
  onTabPress: PropTypes.func,
};

// Default props
ProfileScreen.defaultProps = {
  profilePhone: "",
  onTabPress: null,
};

// Error Boundary Component for crash protection
class ProfileErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // Error caught and handled silently
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Oops! Something went wrong
          </Text>
          <Text style={{ textAlign: "center", color: "#666" }}>
            We're sorry, but there was an error loading your profile. Please
            restart the app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

ProfileErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

// Wrapped ProfileScreen with Error Boundary
const ProfileScreenWithErrorBoundary = (props) => (
  <ProfileErrorBoundary>
    <ProfileScreen {...props} />
  </ProfileErrorBoundary>
);

export { ProfileErrorBoundary };
export default ProfileScreenWithErrorBoundary;
