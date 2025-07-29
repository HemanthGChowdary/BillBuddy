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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import PropTypes from "prop-types";
import { Colors, Typography, Spacing, BorderRadius } from "../styles/theme";

function ProfileScreen({
  profileName,
  setProfileName,
  profileEmoji,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  darkMode,
  setDarkMode,
  liquidGlassMode,
  setLiquidGlassMode,
  onSignOut, // Function to handle sign out
  onTabPress, // Function to be called on tab press
  onNavigateToSignUp, // Function to navigate to sign up screen
  navigation, // Navigation object for fallback
}) {
  const insets = useSafeAreaInsets();
  const navigationSpacing = Math.max(insets.bottom, 20) + 10 + 40;

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

  // Two-Factor Authentication states
  const [twoFactorStep, setTwoFactorStep] = useState("setup"); // setup, verify, enabled
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);
  const [timerRef, setTimerRef] = useState(null);

  // Password validation states
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    isValid: false,
  });
  const [realTimePasswordErrors, setRealTimePasswordErrors] = useState({});

  // Account deletion flag
  const [isAccountDeleted, setIsAccountDeleted] = useState(false);

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
    loadProfileImage();
    loadTwoFactorStatus();

    // Cleanup timer on unmount
    return () => {
      if (timerRef) {
        clearInterval(timerRef);
      }
    };
  }, []);

  // Load two-factor authentication status
  const loadTwoFactorStatus = async () => {
    try {
      if (isAccountDeleted) return; // Don't load if account was deleted

      const twoFactorEnabled = await AsyncStorage.getItem(
        "@two_factor_enabled"
      );
      if (twoFactorEnabled === "true") {
        setTwoFactorAuth(true);
        setTwoFactorStep("enabled");
      }
    } catch (error) {
      // Error loading 2FA status - continue with defaults
    }
  };

  const loadCurrentUser = async () => {
    try {
      if (isAccountDeleted) return; // Don't load if account was deleted

      const savedUser = await AsyncStorage.getItem("@current_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else if (profileName && profileEmail) {
        // Create user from profile data if available
        const userData = {
          id: Date.now().toString(),
          name: profileName,
          email: profileEmail,
          phone: phone || "",
          profileImage: profileImage,
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(userData);
      }
    } catch (error) {
      // Continue without user data
    }
  };

  const loadUserSettings = async () => {
    try {
      if (isAccountDeleted) return; // Don't load if account was deleted

      const savedSettings = await AsyncStorage.getItem("@user_settings");
      if (savedSettings) {
        setUserSettings(JSON.parse(savedSettings));
      } else {
        // Default settings for new users
        const defaultSettings = {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
        };
        setUserSettings(defaultSettings);
        await AsyncStorage.setItem(
          "@user_settings",
          JSON.stringify(defaultSettings)
        );
      }
    } catch (error) {
      // Fallback to default settings on error
      setUserSettings({
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
      });
    }
  };

  const loadProfileData = async () => {
    try {
      // Profile data loaded from props and AsyncStorage
      const savedProfile = await AsyncStorage.getItem("@profile_data");
      if (savedProfile) {
        // Profile data is managed by parent component props
        // Data validation could be added here if needed
      }
    } catch (error) {
      // Continue with props-based profile data
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

  // Enhanced password validation with real-time feedback
  const validatePasswordStrength = useCallback((password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const feedback = [];

    if (!checks.length) feedback.push("At least 8 characters");
    if (!checks.uppercase) feedback.push("One uppercase letter");
    if (!checks.lowercase) feedback.push("One lowercase letter");
    if (!checks.number) feedback.push("One number");
    if (!checks.special) feedback.push("One special character");

    const strength = {
      score,
      feedback,
      isValid: score >= 4,
      level: score <= 2 ? "weak" : score <= 3 ? "medium" : "strong",
    };

    setPasswordStrength(strength);
    return strength;
  }, []);

  // Generate random verification code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send SMS verification code (simulated)
  const sendVerificationCode = useCallback(async () => {
    try {
      setIsVerifyingCode(true);
      const code = generateVerificationCode();
      setSentCode(code);

      // Simulate SMS sending delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Start countdown timer
      setCodeTimer(60);
      const timer = setInterval(() => {
        setCodeTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimerRef(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerRef(timer);

      Alert.alert(
        "Verification Code Sent",
        `A verification code has been sent to ${phone || profilePhone}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to send verification code. Please try again."
      );
    } finally {
      setIsVerifyingCode(false);
    }
  }, [phone, profilePhone]);

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

  // Real-time password change handlers
  const handleCurrentPasswordChange = useCallback(
    (text) => {
      setCurrentPassword(text);
      const newErrors = { ...realTimePasswordErrors };
      if (text.length === 0) {
        newErrors.currentPassword = "Current password is required";
      } else {
        delete newErrors.currentPassword;
      }
      setRealTimePasswordErrors(newErrors);
    },
    [realTimePasswordErrors]
  );

  const handleNewPasswordChange = useCallback(
    (text) => {
      setNewPassword(text);
      validatePasswordStrength(text);

      const newErrors = { ...realTimePasswordErrors };
      if (text.length === 0) {
        newErrors.newPassword = "New password is required";
      } else if (!validatePassword(text)) {
        newErrors.newPassword = "Password must meet security requirements";
      } else {
        delete newErrors.newPassword;
      }

      // Check confirm password match if it exists
      if (confirmPassword && text !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      } else if (confirmPassword && text === confirmPassword) {
        delete newErrors.confirmPassword;
      }

      setRealTimePasswordErrors(newErrors);
    },
    [confirmPassword, realTimePasswordErrors, validatePasswordStrength]
  );

  const handleConfirmPasswordChange = useCallback(
    (text) => {
      setConfirmPassword(text);
      const newErrors = { ...realTimePasswordErrors };

      if (text.length === 0) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (text !== newPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        delete newErrors.confirmPassword;
      }

      setRealTimePasswordErrors(newErrors);
    },
    [newPassword, realTimePasswordErrors]
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

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false, // Disable editing to prevent zoom crashes
        quality: 0.5, // Lower quality to prevent memory issues
        allowsMultipleSelection: false,
        exif: false,
        base64: false,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
        const imageUri = result.assets[0].uri;

        // Validate the URI before setting
        if (typeof imageUri === "string" && imageUri.length > 0) {
          setProfileImage(imageUri);
          await saveProfileImage(imageUri);
        }
      }
    } catch (error) {
      // Handle specific types of errors
      if (
        error.message?.includes("memory") ||
        error.message?.includes("Memory")
      ) {
        Alert.alert(
          "Memory Error",
          "Camera image processing failed. Please try again."
        );
      } else if (
        error.message?.includes("permission") ||
        error.message?.includes("Permission")
      ) {
        Alert.alert(
          "Permission Error",
          "Please allow camera access in Settings."
        );
      } else {
        Alert.alert(
          "Error",
          `Unable to access camera: ${error.message || "Please try again."}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    if (!(await requestPermissions())) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false, // Disable editing to prevent zoom crashes
        quality: 0.5, // Lower quality to prevent memory issues
        allowsMultipleSelection: false,
        exif: false,
        base64: false,
        selectionLimit: 1,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
        const imageUri = result.assets[0].uri;

        // Validate the URI before setting
        if (typeof imageUri === "string" && imageUri.length > 0) {
          setProfileImage(imageUri);
          await saveProfileImage(imageUri);
        }
      }
    } catch (error) {
      // Handle specific types of errors
      if (
        error.message?.includes("memory") ||
        error.message?.includes("Memory")
      ) {
        Alert.alert(
          "Memory Error",
          "The selected image is too large. Please try selecting a smaller image."
        );
      } else if (
        error.message?.includes("permission") ||
        error.message?.includes("Permission")
      ) {
        Alert.alert(
          "Permission Error",
          "Please allow access to your photo library in Settings."
        );
      } else {
        Alert.alert(
          "Error",
          `Unable to access photo library: ${
            error.message || "Please try again."
          }`
        );
      }
    } finally {
      setIsLoading(false);
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
      if (imageUri) {
        await AsyncStorage.setItem("@profile_image", imageUri);
      } else {
        await AsyncStorage.removeItem("@profile_image");
      }
    } catch (error) {
      // Error saving profile image - continue silently
    }
  };

  const loadProfileImage = async () => {
    try {
      if (isAccountDeleted) return; // Don't load if account was deleted

      const savedImageUri = await AsyncStorage.getItem("@profile_image");
      if (savedImageUri) {
        setProfileImage(savedImageUri);
      }
    } catch (error) {
      // Error loading profile image - continue without image
    }
  };

  // Sign in handler
  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);

      // Validate required fields before sign in
      if (!profileName || !profileEmail) {
        Alert.alert(
          "Missing Information",
          "Please complete your profile information before signing in."
        );
        return;
      }
      
      // Check if this email was previously deleted
      const emailToCheck = profileEmail.toLowerCase();
      try {
        const deletedAccountsData = await AsyncStorage.getItem("@deleted_accounts");
        
        if (deletedAccountsData) {
          const deletedAccounts = JSON.parse(deletedAccountsData);
          const isDeleted = deletedAccounts.some(account => account.email === emailToCheck);
          
          if (isDeleted) {
            Alert.alert(
              "Account Not Found",
              "This account has been permanently deleted and cannot be restored. Please create a new account.",
              [
                { text: "OK" },
                {
                  text: "Create New Account",
                  onPress: () => {
                    // Clear the form for new account creation
                    setProfileName("");
                    setProfileEmail("");
                    setPhone("");
                    setProfileImage(null);
                    if (onNavigateToSignUp) {
                      onNavigateToSignUp();
                    }
                  }
                }
              ]
            );
            return;
          }
        }
      } catch (error) {
        // Continue with sign in if we can't check deleted accounts
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const userData = {
        id: Date.now().toString(),
        name: profileName,
        email: profileEmail.toLowerCase(),
        phone: phone || "",
        profileImage: profileImage,
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(userData);
      Alert.alert("Welcome!", "You have successfully signed in.");
    } catch (error) {
      Alert.alert("Error", "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profileName, profileEmail, phone, profileImage, onNavigateToSignUp]);

  // Enhanced two-factor authentication handler
  const handleTwoFactorToggle = useCallback(
    async (value) => {
      if (value) {
        // Enabling 2FA - start verification process
        if (!phone && !profilePhone) {
          Alert.alert(
            "Phone Required",
            "Please add a phone number to enable two-factor authentication.",
            [{ text: "OK", onPress: () => setTwoFactorAuth(false) }]
          );
          return;
        }

        setTwoFactorStep("setup");
        setTwoFactorAuth(true);
        await sendVerificationCode();
      } else {
        // Disabling 2FA
        Alert.alert(
          "Disable Two-Factor Authentication",
          "Are you sure you want to disable this security feature?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Disable",
              style: "destructive",
              onPress: async () => {
                try {
                  await AsyncStorage.removeItem("@two_factor_enabled");
                  setTwoFactorAuth(false);
                  setTwoFactorStep("setup");
                  setVerificationCode("");
                  setSentCode("");
                  Alert.alert(
                    "Disabled",
                    "Two-factor authentication has been disabled."
                  );
                } catch (error) {
                  // Error disabling 2FA - continue silently
                }
              },
            },
          ]
        );
      }
    },
    [phone, profilePhone, sendVerificationCode]
  );

  // Verify 2FA code
  const verifyTwoFactorCode = useCallback(async () => {
    if (verificationCode.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a 6-digit verification code.");
      return;
    }

    setIsVerifyingCode(true);

    try {
      // Simulate verification delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (verificationCode === sentCode) {
        await AsyncStorage.setItem("@two_factor_enabled", "true");
        setTwoFactorStep("enabled");
        setVerificationCode("");
        setSentCode("");

        // Clear timer if active
        if (timerRef) {
          clearInterval(timerRef);
          setTimerRef(null);
          setCodeTimer(0);
        }

        Alert.alert("Success", "Two-factor authentication has been enabled!");
      } else {
        Alert.alert(
          "Invalid Code",
          "The verification code is incorrect. Please try again."
        );
        setVerificationCode("");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify code. Please try again.");
    } finally {
      setIsVerifyingCode(false);
    }
  }, [verificationCode, sentCode, timerRef]);

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
        // Simulate password update process
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Clear form and reset states
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setRealTimePasswordErrors({});
        setPasswordStrength({ score: 0, feedback: [], isValid: false });
        setShowPasswordSection(false);

        Alert.alert("Success", "Your password has been updated successfully!");
        goBack();
      } catch (error) {
        Alert.alert("Error", "Failed to update password. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentPassword, newPassword, confirmPassword]);

  // Authentication handlers
  const handleSignOut = useCallback(async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoading(true);

            if (onSignOut) {
              await onSignOut();
            }

            // Reset local states
            setCurrentUser(null);
            setPhone("");
            setProfileImage(null);

            Alert.alert("Signed Out", "You have been signed out successfully.");
          } catch (error) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  }, [onSignOut]);

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

              // Add email to deleted accounts list before clearing data
              const deletedEmail = profileEmail || currentUser?.email;
              if (deletedEmail) {
                try {
                  const existingDeletedAccounts = await AsyncStorage.getItem("@deleted_accounts");
                  const deletedAccounts = existingDeletedAccounts 
                    ? JSON.parse(existingDeletedAccounts) 
                    : [];
                  
                  // Add current account to deleted list with timestamp
                  const deletedAccountRecord = {
                    email: deletedEmail.toLowerCase(),
                    deletedAt: new Date().toISOString(),
                    reason: "user_requested"
                  };
                  
                  deletedAccounts.push(deletedAccountRecord);
                  await AsyncStorage.setItem("@deleted_accounts", JSON.stringify(deletedAccounts));
                } catch (error) {
                  // Continue with deletion even if we can't save to deleted list
                }
              }
              
              // Clear ALL stored data from AsyncStorage
              const keysToRemove = [
                // Profile data
                "@profile_image",
                "@two_factor_enabled", 
                "@user_settings",
                "@profile_data",
                "@current_user",
                "profileName",
                "profileEmail", 
                "profilePhone",
                "profileEmoji",
                "isAuthenticated",
                // Password data
                `password_${(profileEmail || currentUser?.email || '').toLowerCase()}`,
                // App data
                "bills",
                "billBuddy_groups", // Groups storage key
                "lastAddedBill",
                // Settings (keep darkMode and liquidGlassMode for UX)
                // "darkMode",
                // "liquidGlassMode"
              ];
              
              // Get all AsyncStorage keys to find user-specific data
              try {
                const allKeys = await AsyncStorage.getAllKeys();
                const userEmail = profileEmail || currentUser?.email;
                const userName = profileName || currentUser?.name;
                
                // Find and add user-scoped keys
                allKeys.forEach(key => {
                  // Friends data (friends_${userId})
                  if (key.startsWith('friends_')) {
                    keysToRemove.push(key);
                  }
                  // Chat data (chat_${chatKey})
                  if (key.startsWith('chat_')) {
                    keysToRemove.push(key);
                  }
                  // Settlement data (settlement_${friendId}_${userId})
                  if (key.startsWith('settlement_')) {
                    keysToRemove.push(key);
                  }
                  // Password data (password_${email})
                  if (key.startsWith('password_')) {
                    keysToRemove.push(key);
                  }
                  // Any other user-specific data
                  if (userEmail && key.includes(userEmail.toLowerCase())) {
                    keysToRemove.push(key);
                  }
                  if (userName && key.includes(userName.toLowerCase())) {
                    keysToRemove.push(key);
                  }
                });
              } catch (error) {
                // Continue with basic deletion if we can't get all keys
              }
              
              // Remove all identified data
              try {
                await AsyncStorage.multiRemove(keysToRemove);
              } catch (error) {
                // If multiRemove fails, try removing keys individually
                try {
                  for (const key of keysToRemove) {
                    await AsyncStorage.removeItem(key);
                  }
                } catch (individualError) {
                  // Continue with state reset even if storage cleanup fails
                }
              }

              // Set deletion flag to prevent data reloading
              setIsAccountDeleted(true);

              // Reset all local states immediately
              try {
                setCurrentUser(null);
                setProfileImage(null);
                setTwoFactorAuth(false);
                setTwoFactorStep("setup");
                setVerificationCode("");
                setSentCode("");
                setErrors({});
                setRealTimePasswordErrors({});
                setPasswordStrength({ score: 0, feedback: [], isValid: false });
                setPhone("");
                
                // Reset parent component states if available
                if (onDataReset && typeof onDataReset === 'function') {
                  onDataReset(); // This will clear bills, friends, groups in App.js
                }
              } catch (stateError) {
                // Continue even if state reset fails
              }

              // Reset parent component states
              if (setProfileName) setProfileName("");
              if (setProfileEmail) setProfileEmail("");
              if (setProfilePhone) setProfilePhone("");

              // Reset user settings to defaults
              setUserSettings({
                emailNotifications: true,
                pushNotifications: true,
                smsNotifications: false,
              });

              setIsLoading(false);

              // Show success message and handle navigation
              Alert.alert(
                "Account Deleted",
                "Your account has been permanently deleted.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      // Navigate only after user presses OK
                      setTimeout(() => {
                        if (onNavigateToSignUp) {
                          onNavigateToSignUp();
                        } else if (navigation) {
                          navigation.reset({
                            index: 0,
                            routes: [{ name: "SignUp" }],
                          });
                        } else if (onSignOut) {
                          // Fallback: trigger sign out which should handle navigation
                          onSignOut();
                        } else {
                          // Last resort: go back to main screen
                          setCurrentTab("main");
                        }
                      }, 100);
                    },
                  },
                ]
              );
            } catch (error) {
              setIsLoading(false);
              console.error("Account deletion error:", error);
              Alert.alert(
                "Error", 
                `Account deletion failed: ${error.message || 'Unknown error'}. Please try again.`
              );
            }
          },
        },
      ]
    );
  }, [
    onNavigateToSignUp,
    navigation,
    onSignOut,
    setProfileName,
    setProfileEmail,
    setProfilePhone,
  ]);

  // Feedback handlers
  const handleRateApp = useCallback(async () => {
    try {
      const result = await new Promise((resolve) => {
        Alert.alert(
          "Rate BillBuddy",
          "Help us improve by rating BillBuddy on the app store!",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Rate Now",
              onPress: () => resolve(true),
            },
          ]
        );
      });

      if (result) {
        // In a real app, this would open the app store
        const appStoreUrl =
          Platform.OS === "ios"
            ? "https://apps.apple.com/app/billbuddy"
            : "https://play.google.com/store/apps/details?id=com.billbuddy";

        await Linking.openURL(appStoreUrl).catch(() => {
          Alert.alert("Thank You!", "Thank you for your feedback! ⭐⭐⭐⭐⭐");
        });
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open app store. Please try again later.");
    }
  }, []);

  const handleContactUs = useCallback(async () => {
    try {
      const result = await new Promise((resolve) => {
        Alert.alert(
          "Contact Us",
          "How would you like to contact our support team?",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
            {
              text: "Email",
              onPress: () => resolve("email"),
            },
            {
              text: "Phone",
              onPress: () => resolve("phone"),
            },
          ]
        );
      });

      if (result === "email") {
        const emailUrl =
          "mailto:support@billbuddy.com?subject=App Support Request";
        await Linking.openURL(emailUrl).catch(() => {
          Alert.alert(
            "Contact Info",
            "Please email us at: support@billbuddy.com"
          );
        });
      } else if (result === "phone") {
        const phoneUrl = "tel:+1-800-BILLBUDDY";
        await Linking.openURL(phoneUrl).catch(() => {
          Alert.alert("Contact Info", "Please call us at: 1-800-BILLBUDDY");
        });
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to open contact method. Please try again later."
      );
    }
  }, []);

  // Form validation and save
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
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Clean and update profile data
      const cleanName = profileName.trim();
      const cleanEmail = profileEmail.trim().toLowerCase();
      const cleanPhone = phone.trim();

      // Update parent component states
      setProfileName(cleanName);
      setProfileEmail(cleanEmail);
      setProfilePhone(cleanPhone);

      // Update local user state
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          profileImage: profileImage,
          updatedAt: new Date().toISOString(),
        };
        setCurrentUser(updatedUser);
      }

      Alert.alert("Success", "Your profile has been updated successfully!");
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

        // Save to AsyncStorage
        await AsyncStorage.setItem(
          "@user_settings",
          JSON.stringify(newSettings)
        );
      } catch (error) {
        // Revert the local state if save failed
        setUserSettings(userSettings);
        Alert.alert("Error", "Failed to update setting. Please try again.");
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
      <View style={[styles.authSection, styles.authSectionCloser]}>
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
              color={darkMode ? Colors.text.accent.dark : Colors.primary}
              style={{ marginTop: Spacing.xs }}
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
            styles.saveButtonHigher,
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
              color={darkMode ? Colors.text.accent.dark : Colors.primary}
              style={{ marginTop: Spacing.xs }}
            />
          </View>
        </TouchableOpacity>
        <Text style={[styles.subTitle, darkMode && styles.darkSubTitle]}>
          Security & Privacy
        </Text>
      </View>

      {/* Two-Factor Authentication Section */}
      <View
        style={[styles.formContainer, darkMode && styles.darkFormContainer]}
      >
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          🔒 Two-Factor Authentication
        </Text>
        <Text style={[styles.sectionSubtitle, darkMode && styles.darkSubtext]}>
          Add an extra layer of security to your account
        </Text>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={[styles.preferenceTitle, darkMode && styles.darkText]}>
              Enable 2FA
            </Text>
            <Text
              style={[
                styles.preferenceSubtitle,
                darkMode && styles.darkSubtext,
              ]}
            >
              {twoFactorStep === "enabled"
                ? "Enabled and active"
                : "Secure your account with SMS verification"}
            </Text>
          </View>
          <Switch
            value={twoFactorAuth}
            onValueChange={handleTwoFactorToggle}
            trackColor={{
              false: darkMode ? Colors.gray600 : Colors.gray300,
              true: darkMode ? Colors.secondary : Colors.primary,
            }}
            thumbColor={Colors.white}
          />
        </View>

        {/* Two-Factor Verification Process */}
        {twoFactorAuth && twoFactorStep !== "enabled" && (
          <View style={styles.twoFactorSetup}>
            <Text style={[styles.label, darkMode && styles.darkText]}>
              Verification Code *
            </Text>
            <TextInput
              placeholder="Enter 6-digit code"
              placeholderTextColor={
                darkMode
                  ? Colors.text.tertiary.dark
                  : Colors.text.tertiary.light
              }
              value={verificationCode}
              onChangeText={setVerificationCode}
              style={[
                styles.input,
                darkMode && styles.darkInput,
                styles.verificationCodeInput,
              ]}
              keyboardType="number-pad"
              maxLength={6}
              accessibilityLabel="Enter six-digit verification code"
              accessibilityHint="Type the verification code sent to your phone"
            />
            <View style={styles.twoFactorActions}>
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  darkMode && { backgroundColor: Colors.secondary },
                  (verificationCode.length !== 6 || isVerifyingCode) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={verifyTwoFactorCode}
                disabled={verificationCode.length !== 6 || isVerifyingCode}
                accessibilityRole="button"
                accessibilityLabel="Verify two-factor authentication code"
                accessibilityHint="Tap to verify the 6-digit code you received"
              >
                <Text style={styles.verifyButtonText}>
                  {isVerifyingCode ? "Verifying..." : "Verify Code"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (codeTimer > 0 || isVerifyingCode) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={sendVerificationCode}
                disabled={codeTimer > 0 || isVerifyingCode}
                accessibilityRole="button"
                accessibilityLabel="Resend verification code"
                accessibilityHint="Tap to receive a new verification code"
              >
                <Text
                  style={[styles.resendButtonText, darkMode && styles.darkText]}
                >
                  {codeTimer > 0
                    ? `Resend in ${codeTimer}s`
                    : isVerifyingCode
                    ? "Sending..."
                    : "Resend Code"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {twoFactorStep === "enabled" && (
          <View style={styles.twoFactorEnabled}>
            <Text
              style={[styles.successText, darkMode && { color: "#10B981" }]}
            >
              ✓ Two-factor authentication is active
            </Text>
            <Text
              style={[
                styles.twoFactorEnabledText,
                darkMode && styles.darkSubtext,
              ]}
            >
              Your account is protected with SMS verification
            </Text>
          </View>
        )}
      </View>

      {/* Password Change Section */}
      <View
        style={[
          styles.formContainer,
          darkMode && styles.darkFormContainer,
          { marginTop: 20 },
        ]}
      >
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>
          🔑 Password Security
        </Text>
        <Text style={[styles.sectionSubtitle, darkMode && styles.darkSubtext]}>
          Change your account password
        </Text>

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
                    onChangeText={handleCurrentPasswordChange}
                    style={[
                      styles.passwordInput,
                      darkMode && styles.darkText,
                      (errors.currentPassword ||
                        realTimePasswordErrors.currentPassword) &&
                        styles.inputError,
                    ]}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                    accessibilityHint="Tap to toggle password visibility"
                  >
                    <Text style={styles.eyeIconText}>
                      {showCurrentPassword ? "🙈" : "👁️"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {(errors.currentPassword ||
                  realTimePasswordErrors.currentPassword) && (
                  <Text style={styles.errorText}>
                    {errors.currentPassword ||
                      realTimePasswordErrors.currentPassword}
                  </Text>
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
                    onChangeText={handleNewPasswordChange}
                    style={[
                      styles.passwordInput,
                      darkMode && styles.darkText,
                      (errors.newPassword ||
                        realTimePasswordErrors.newPassword) &&
                        styles.inputError,
                    ]}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                    accessibilityHint="Tap to toggle password visibility"
                  >
                    <Text style={styles.eyeIconText}>
                      {showNewPassword ? "🙈" : "👁️"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {(errors.newPassword || realTimePasswordErrors.newPassword) && (
                  <Text style={styles.errorText}>
                    {errors.newPassword || realTimePasswordErrors.newPassword}
                  </Text>
                )}
                {newPassword && (
                  <View style={styles.passwordStrengthContainer}>
                    <Text
                      style={[
                        styles.passwordStrengthLabel,
                        darkMode && styles.darkText,
                      ]}
                    >
                      Password Strength:
                      <Text
                        style={[
                          styles.passwordStrengthLevel,
                          {
                            color:
                              passwordStrength.level === "weak"
                                ? "#EF4444"
                                : passwordStrength.level === "medium"
                                ? "#F59E0B"
                                : "#10B981",
                          },
                        ]}
                      >
                        {passwordStrength.level?.toUpperCase()}
                      </Text>
                    </Text>
                    <View style={styles.passwordStrengthBar}>
                      <View
                        style={[
                          styles.passwordStrengthFill,
                          {
                            width: `${(passwordStrength.score / 5) * 100}%`,
                            backgroundColor:
                              passwordStrength.level === "weak"
                                ? "#EF4444"
                                : passwordStrength.level === "medium"
                                ? "#F59E0B"
                                : "#10B981",
                          },
                        ]}
                      />
                    </View>
                    {passwordStrength.feedback.length > 0 && (
                      <Text
                        style={[
                          styles.passwordFeedback,
                          darkMode && styles.darkSubtext,
                        ]}
                      >
                        Missing: {passwordStrength.feedback.join(", ")}
                      </Text>
                    )}
                  </View>
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
                    onChangeText={handleConfirmPasswordChange}
                    style={[
                      styles.passwordInput,
                      darkMode && styles.darkText,
                      (errors.confirmPassword ||
                        realTimePasswordErrors.confirmPassword) &&
                        styles.inputError,
                    ]}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword
                        ? "Hide password confirmation"
                        : "Show password confirmation"
                    }
                    accessibilityHint="Tap to toggle password visibility"
                  >
                    <Text style={styles.eyeIconText}>
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {(errors.confirmPassword ||
                  realTimePasswordErrors.confirmPassword) && (
                  <Text style={styles.errorText}>
                    {errors.confirmPassword ||
                      realTimePasswordErrors.confirmPassword}
                  </Text>
                )}
                {confirmPassword &&
                  newPassword &&
                  confirmPassword === newPassword && (
                    <Text
                      style={[
                        styles.successText,
                        darkMode && { color: "#10B981" },
                      ]}
                    >
                      ✓ Passwords match
                    </Text>
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
              color={darkMode ? Colors.text.accent.dark : Colors.primary}
              style={{ marginTop: Spacing.xs }}
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
              false: darkMode ? Colors.gray600 : Colors.gray300,
              true: darkMode ? Colors.secondary : Colors.primary,
            }}
            thumbColor={Colors.white}
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
              false: darkMode ? Colors.gray600 : Colors.gray300,
              true: darkMode ? Colors.secondary : Colors.primary,
            }}
            thumbColor={Colors.white}
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
              false: darkMode ? Colors.gray600 : Colors.gray300,
              true: darkMode ? Colors.secondary : Colors.primary,
            }}
            thumbColor={Colors.white}
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
              false: darkMode ? Colors.gray600 : Colors.gray300,
              true: darkMode ? Colors.secondary : Colors.primary,
            }}
            thumbColor={Colors.white}
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
              false: darkMode ? Colors.gray600 : Colors.gray300,
              true: darkMode ? Colors.secondary : Colors.primary,
            }}
            thumbColor={Colors.white}
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
              color={darkMode ? Colors.text.accent.dark : Colors.primary}
              style={{ marginTop: Spacing.xs }}
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
    backgroundColor: Colors.background.light,
  },
  darkContainer: {
    backgroundColor: Colors.background.dark,
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
    ...Typography.textStyles.h1,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary.light,
    textAlign: "center",
  },

  // Sub Headers
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
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
    ...Typography.textStyles.h2,
    color: Colors.primary,
    textAlign: "center",
    flex: 1,
  },
  darkSubTitle: {
    color: Colors.text.accent.dark,
  },

  // Profile Picture
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 25,
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
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.white,
  },
  darkPlaceholder: {
    backgroundColor: Colors.gray600,
  },
  profileImageText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    alignContent: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 15,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cameraEmoji: {
    fontSize: 14,
  },
  profileImageHint: {
    fontSize: 16,
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
    backgroundColor: Colors.background.card.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkMenuitem: {
    backgroundColor: Colors.background.card.dark,
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
    ...Typography.textStyles.h4,
    color: Colors.text.primary.light,
    marginBottom: 4,
  },
  menuSubtitle: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary.light,
  },
  chevron: {
    fontSize: 24,
    color: "#9CA3AF",
    fontWeight: "300",
  },

  // Form Container
  formContainer: {
    backgroundColor: Colors.background.card.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkFormContainer: {
    backgroundColor: Colors.background.card.dark,
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
    marginTop: 6,
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
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonHigher: {
    marginTop: Spacing.md,
  },
  darkSaveButton: {
    backgroundColor: Colors.text.accent.dark,
    shadowColor: Colors.text.accent.dark,
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
  authSectionCloser: {
    marginTop: 30,
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
    backgroundColor: Colors.info.light,
  },
  signOutButton: {
    backgroundColor: Colors.error.light,
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
    color: Colors.text.primary.dark,
  },
  darkTitleText: {
    color: Colors.text.accent.dark,
  },
  darkSubtext: {
    color: Colors.text.secondary.dark,
  },

  welcomeMessage: {
    ...Typography.textStyles.h3,
    color: Colors.primary,
    marginBottom: Spacing.xl,
    marginTop: -Spacing.xl,
    marginLeft: 10,
    textAlign: "center",
  },
  darkWelcomeMessage: {
    color: Colors.text.accent.dark,
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

  // Section titles and headers
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 18,
  },

  // Two-Factor Authentication styles
  twoFactorSetup: {
    marginTop: 12,
    paddingTop: 8,
  },
  twoFactorActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    flex: 1,
    marginRight: Spacing.sm,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    flex: 1,
    marginLeft: Spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.background.card.light,
  },
  resendButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },
  twoFactorEnabled: {
    marginTop: 12,
    paddingTop: 0,
  },
  twoFactorEnabledText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
  },

  // Password strength indicator
  passwordStrengthContainer: {
    marginTop: 8,
  },
  passwordStrengthLabel: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
  passwordStrengthLevel: {
    fontWeight: "600",
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginBottom: 6,
  },
  passwordStrengthFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.3s ease",
  },
  passwordFeedback: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },

  // Success text
  successText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 6,
  },

  // Verification code input
  verificationCodeInput: {
    textAlign: "center",
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 2,
  },
});

// PropTypes for type safety
ProfileScreen.propTypes = {
  profileName: PropTypes.string.isRequired,
  setProfileName: PropTypes.func.isRequired,
  profileEmoji: PropTypes.string,
  profileEmail: PropTypes.string.isRequired,
  setProfileEmail: PropTypes.func.isRequired,
  profilePhone: PropTypes.string,
  setProfilePhone: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired,
  setDarkMode: PropTypes.func.isRequired,
  liquidGlassMode: PropTypes.bool.isRequired,
  setLiquidGlassMode: PropTypes.func.isRequired,
  onSignOut: PropTypes.func,
  onTabPress: PropTypes.func,
  onNavigateToSignUp: PropTypes.func,
  navigation: PropTypes.object,
};

// Default props
ProfileScreen.defaultProps = {
  profilePhone: "",
  onSignOut: null,
  onTabPress: null,
  onNavigateToSignUp: null,
  navigation: null,
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
