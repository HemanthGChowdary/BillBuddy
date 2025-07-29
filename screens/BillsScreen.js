import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  Pressable,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
  ActionSheetIOS,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { Colors, Typography, Spacing, BorderRadius } from "../styles/theme";
import { 
  requestCameraPermissionWithEducation, 
  requestMediaLibraryPermissionWithEducation,
  checkImagePermissions 
} from "../utils/permissions";
import {
  currencyOptions,
  getFriendsDropdownOptions,
  getCurrencySymbol,
  validateNoteWordCount,
  getWordCount,
} from "../utils/helpers";

const BillsScreen = ({
  friends,
  addBill,
  profileName,
  profileEmoji,
  recentBills = [],
  darkMode = false,
}) => {
  const insets = useSafeAreaInsets();
  const you = profileName?.trim() || "You";
  const fullFriendsList = useMemo(
    () => getFriendsDropdownOptions(friends, you),
    [friends, you]
  );

  // Enhanced friends list with emojis for dropdowns
  const enhancedFriendsList = useMemo(() => {
    const userEmoji = profileEmoji || "👤";
    if (!friends || !Array.isArray(friends))
      return [{ label: `${userEmoji} ${you}`, value: you }];

    const friendOptions = friends.map((friend) => ({
      label: `${friend.emoji || "👤"} ${friend.name}`,
      value: friend.name,
    }));

    return [{ label: `${userEmoji} ${you}`, value: you }, ...friendOptions];
  }, [friends, you, profileEmoji]);

  // Core states
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [payer, setPayer] = useState(null);
  const [splitWith, setSplitWith] = useState([]);
  const [note, setNote] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Enhanced features states
  const [billPhoto, setBillPhoto] = useState(null);
  const [splitType, setSplitType] = useState("equal"); // "equal" or "custom"
  const [customSplitAmounts, setCustomSplitAmounts] = useState({});
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastAddedBill, setLastAddedBill] = useState(null);

  // Dropdown states and items
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false);
  const [payerDropdownOpen, setPayerDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [splitItems, setSplitItems] = useState(enhancedFriendsList);
  const [payerItems, setPayerItems] = useState(enhancedFriendsList);
  const [currencyItems, setCurrencyItems] = useState(currencyOptions);

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);
  const amountInputRef = useRef(null);

  // Dynamic styles based on dark mode
  const styles = useMemo(
    () => createStyles(darkMode, insets),
    [darkMode, insets]
  );

  // Calculate amount input padding based on currency symbol length
  const amountInputPadding = useMemo(() => {
    if (!currencySymbol) return 35;
    const length = currencySymbol.length;
    if (length === 1) return 35;
    if (length === 2) return 45;
    if (length >= 3) return 70;
    return 40;
  }, [currencySymbol]);

  // Update dropdown items when friends change
  useEffect(() => {
    setSplitItems(enhancedFriendsList);
    setPayerItems(enhancedFriendsList);
  }, [enhancedFriendsList]);

  // Animate in
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Initialize empty custom splits for new participants only
  useEffect(() => {
    if (splitType !== "equal" && splitWith.length > 0) {
      const participants = Array.from(new Set([payer, ...splitWith])).filter(
        Boolean
      );
      const newCustomSplits = {};

      participants.forEach((participant) => {
        // Only keep existing values, don't auto-populate new ones
        if (customSplitAmounts[participant]) {
          newCustomSplits[participant] = customSplitAmounts[participant];
        } else {
          newCustomSplits[participant] = "";
        }
      });

      setCustomSplitAmounts(newCustomSplits);
    }
  }, [splitWith, payer]);

  // Error clearing effects
  useEffect(() => {
    if (errors.billName && billName.trim())
      setErrors((e) => ({ ...e, billName: null }));
  }, [billName, errors.billName]);

  useEffect(() => {
    if (errors.billAmount && billAmount && !isNaN(parseFloat(billAmount)))
      setErrors((e) => ({ ...e, billAmount: null }));
  }, [billAmount, errors.billAmount]);

  useEffect(() => {
    if (errors.payer && payer) setErrors((e) => ({ ...e, payer: null }));
  }, [payer, errors.payer]);

  useEffect(() => {
    if (errors.splitWith && splitWith.length > 0)
      setErrors((e) => ({ ...e, splitWith: null }));
  }, [splitWith, errors.splitWith]);

  // Reset form when friends/profile changes
  useEffect(() => {
    resetForm();
  }, [friends, profileName]);

  const handleAmountChange = useCallback((text) => {
    const cleanText = text.replace(/[^0-9.]/g, "");
    const parts = cleanText.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) {
      setBillAmount(parts[0] + "." + parts[1].substring(0, 2));
    } else {
      setBillAmount(cleanText);
    }
  }, []);

  const handleCustomSplitChange = useCallback((participant, value) => {
    const cleanValue = value.replace(/[^0-9.]/g, "");
    setCustomSplitAmounts((prev) => ({
      ...prev,
      [participant]: cleanValue,
    }));
  }, []);

  const getRecentSplitPartners = useCallback(() => {
    if (!recentBills?.length) return [];
    const partnerFrequency = {};
    recentBills.forEach((bill) => {
      bill.splitWith?.forEach((partner) => {
        if (partner !== you) {
          partnerFrequency[partner] = (partnerFrequency[partner] || 0) + 1;
        }
      });
    });
    return Object.entries(partnerFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([partner]) => fullFriendsList.find((f) => f.value === partner))
      .filter(Boolean);
  }, [recentBills, you, fullFriendsList]);

  const closeAllDropdowns = useCallback(() => {
    setSplitDropdownOpen(false);
    setPayerDropdownOpen(false);
    setCurrencyDropdownOpen(false);
  }, []);

  const resetForm = useCallback(() => {
    setBillName("");
    setBillAmount("");
    setPayer(null);
    setSplitWith([]);
    setNote("");
    setCurrency("USD");
    setBillPhoto(null);
    setSplitType("equal");
    setCustomSplitAmounts({});
    setExpenseDate(new Date());
    setErrors({});
    closeAllDropdowns();
  }, [closeAllDropdowns]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    resetForm();
    await new Promise((resolve) => setTimeout(resolve, 300));
    setRefreshing(false);
  }, [resetForm]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!billName.trim()) newErrors.billName = "Expense name is required";

    const amount = parseFloat(billAmount);
    if (!billAmount.trim()) {
      newErrors.billAmount = "Amount is required";
    } else if (isNaN(amount)) {
      newErrors.billAmount = "Please enter a valid number";
    } else if (amount <= 0) {
      newErrors.billAmount = "Amount must be greater than 0";
    } else if (amount > 999999) {
      newErrors.billAmount = "Amount is too large";
    }

    if (!payer) newErrors.payer = "Please select who paid";
    if (splitWith.length === 0) {
      newErrors.splitWith = "Please select who to split with";
    } else if (splitWith.length === 1 && splitWith[0] === payer) {
      newErrors.splitWith = "Can't split with only yourself";
    }

    // Validate custom splits
    if (splitType === "custom") {
      const totalCustomAmount = Object.values(customSplitAmounts).reduce(
        (total, amount) => {
          return total + (parseFloat(amount) || 0);
        },
        0
      );

      if (Math.abs(totalCustomAmount - amount) > 0.01) {
        newErrors.customSplitAmounts = `Custom split total (${totalCustomAmount.toFixed(
          2
        )}) must equal bill amount (${amount.toFixed(2)})`;
      }

      // Check if all split members have amounts
      const missingAmounts = splitWith.filter(
        (member) =>
          !customSplitAmounts[member] ||
          parseFloat(customSplitAmounts[member]) <= 0
      );

      if (missingAmounts.length > 0) {
        newErrors.customSplitAmounts = `Please enter valid amounts for all members: ${missingAmounts.join(
          ", "
        )}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [billName, billAmount, payer, splitWith, splitType, customSplitAmounts]);

  const undoLastBill = async () => {
    if (lastAddedBill) {
      Alert.alert("Undo", "Bill removed successfully");
      setLastAddedBill(null);
    }
  };

  const handleAddBill = useCallback(async () => {
    closeAllDropdowns();
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const splitGroup = splitWith.includes(payer)
        ? splitWith
        : [payer, ...splitWith];
      const participants = [...new Set([payer, ...splitWith])].filter(Boolean);
      let splitAmounts = {};
      const amount = parseFloat(billAmount);

      if (splitType === "equal") {
        const amountPerPerson = amount / participants.length;
        participants.forEach((p) => {
          splitAmounts[p] = amountPerPerson;
        });
      } else if (splitType === "custom") {
        participants.forEach((p) => {
          splitAmounts[p] = parseFloat(customSplitAmounts[p] || 0);
        });
      }

      const newBill = {
        id: Date.now().toString(),
        name: billName.trim(),
        amount: parseFloat(billAmount).toFixed(2),
        currency,
        payer,
        splitWith: splitGroup,
        splitType,
        splitAmounts,
        date: expenseDate.toISOString(),
        note: note.trim(),
        photoUri: billPhoto,
        createdAt: new Date().toISOString(),
      };

      await addBill(newBill);
      setLastAddedBill(newBill);
      await AsyncStorage.setItem("lastAddedBill", JSON.stringify(newBill));

      resetForm();

      Alert.alert(
        "Success! 🎉",
        `${newBill.name} has been added successfully!`,
        [
          {
            text: "Undo",
            onPress: undoLastBill,
            style: "destructive",
          },
          { text: "Great!", style: "default" },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    closeAllDropdowns,
    validateForm,
    payer,
    splitWith,
    billAmount,
    splitType,
    customSplitAmounts,
    currency,
    expenseDate,
    note,
    billPhoto,
    addBill,
    resetForm,
    billName,
  ]);

  // Check if this is first time using camera/library
  const checkFirstTimePermissions = async () => {
    const permissions = await checkImagePermissions();
    return permissions.both;
  };

  const pickImage = useCallback(async () => {
    // Request permission with proper education for photo library
    const hasPermission = await requestMediaLibraryPermissionWithEducation('attach receipt photos');
    if (!hasPermission) return;
    
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
      
      if (!result.canceled && result.assets?.length > 0) {
        setBillPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        `Unable to access photo library: ${error.message || "Please try again."}`
      );
    }
  }, []);

  const launchCamera = useCallback(async () => {
    // Request permission with proper education for camera
    const hasPermission = await requestCameraPermissionWithEducation('take receipt photos');
    if (!hasPermission) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false, // Disable editing to prevent zoom crashes
        quality: 0.5, // Lower quality to prevent memory issues
        exif: false,
        base64: false,
      });
      
      if (!result.canceled && result.assets?.length > 0) {
        setBillPhoto(result.assets[0].uri);
      }
    } catch (error) {
      if (
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
    }
  }, []);

  const handleImagePicker = useCallback(() => {
    closeAllDropdowns();
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
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: launchCamera },
        { text: "Choose from Library", onPress: pickImage },
      ]);
    }
  }, [closeAllDropdowns, launchCamera, pickImage]);

  const handleClearPhoto = useCallback(() => {
    setBillPhoto(null);
  }, []);

  // Split preview
  const splitPreview = useMemo(() => {
    if (
      !billAmount ||
      !splitWith.length ||
      isNaN(parseFloat(billAmount)) ||
      !payer
    ) {
      return null;
    }

    const amount = parseFloat(billAmount);
    const participants = [...new Set([payer, ...splitWith])].filter(Boolean);
    if (participants.length === 0) return null;

    let preview = {
      totalPeople: participants.length,
      totalAmount: amount.toFixed(2),
      breakdown: [],
    };

    if (splitType === "equal") {
      const amountPerPerson = amount / participants.length;
      preview.amountPerPerson = amountPerPerson.toFixed(2);
    } else if (splitType === "custom") {
      preview.breakdown = participants.map((p) => {
        const personAmount = parseFloat(customSplitAmounts[p] || 0);
        return {
          person: fullFriendsList.find((f) => f.value === p)?.label || p,
          amount: personAmount.toFixed(2),
        };
      });
    }

    return preview;
  }, [
    billAmount,
    splitWith,
    payer,
    splitType,
    customSplitAmounts,
    fullFriendsList,
  ]);

  // Custom split inputs component
  const CustomSplitInputs = useCallback(() => {
    return (
      <View style={styles.customSplitContainer}>
        <Text style={styles.customSplitLabel}>
          Enter amount for each person:
        </Text>
        {splitWith.map((member, index) => {
          const friendLabel =
            fullFriendsList.find((f) => f.value === member)?.label || member;
          return (
            <View key={index} style={styles.customSplitRow}>
              <Text style={styles.customSplitName}>{friendLabel}</Text>
              <View style={styles.customSplitInputContainer}>
                <Text style={styles.customSplitPrefix}>{currencySymbol}</Text>
                <TextInput
                  value={customSplitAmounts[member] || ""}
                  onChangeText={(value) =>
                    handleCustomSplitChange(member, value)
                  }
                  keyboardType="decimal-pad"
                  style={styles.customSplitInput}
                  placeholder="0.00"
                  placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                  accessibilityLabel={`Split amount for ${friendLabel}`}
                />
              </View>
            </View>
          );
        })}
        <Text style={styles.customSplitTotal}>
          Total: {currencySymbol}
          {Object.values(customSplitAmounts)
            .reduce((total, amount) => {
              return total + (parseFloat(amount) || 0);
            }, 0)
            .toFixed(2)}{" "}
          / {currencySymbol}
          {billAmount}
        </Text>
        {errors.customSplitAmounts && (
          <Text style={styles.errorText}>{errors.customSplitAmounts}</Text>
        )}
      </View>
    );
  }, [
    splitWith,
    fullFriendsList,
    currencySymbol,
    customSplitAmounts,
    handleCustomSplitChange,
    errors.customSplitAmounts,
    styles,
    darkMode,
    billAmount,
  ]);

  const handleSplitType = useCallback(
    (type) => {
      setSplitType(type);
      // Auto-populate equal amounts when switching to custom
      if (type === "custom" && splitWith.length > 0 && billAmount) {
        const equalAmount = (parseFloat(billAmount) / splitWith.length).toFixed(
          2
        );
        const newCustomAmounts = {};
        splitWith.forEach((member) => {
          newCustomAmounts[member] = equalAmount;
        });
        setCustomSplitAmounts(newCustomAmounts);
      } else {
        setCustomSplitAmounts({});
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [splitWith, billAmount]
  );

  const handleDateChange = useCallback((_, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setExpenseDate(selectedDate);
    }
  }, []);

  const isFormValid = useMemo(() => {
    const amt = parseFloat(billAmount);
    if (!billName.trim()) return false;
    if (!billAmount || isNaN(amt) || amt <= 0) return false;
    if (!payer) return false;
    if (!splitWith.length) return false;
    if (splitType === "custom") {
      const sum = Object.values(customSplitAmounts).reduce((total, amount) => {
        return total + (parseFloat(amount) || 0);
      }, 0);
      if (Math.abs(sum - amt) > 0.01) {
        return false;
      }
    }
    return true;
  }, [billName, billAmount, payer, splitWith, splitType, customSplitAmounts]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={darkMode ? Colors.background.dark : Colors.background.light}
      />

      {/* Header - Glassmorphism */}
      <View style={styles.headerContainer}>
        <BlurView
          intensity={15}
          tint={darkMode ? "dark" : "light"}
          style={styles.headerBlurView}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View style={styles.logoContainer}>
                <View style={styles.logoOuter}>
                  <View style={styles.logoInner}>
                    <Text style={styles.logoText}>BB</Text>
                  </View>
                </View>
              </View>
              <View>
                <Text style={styles.headerTitle}>Bill Buddy</Text>
                <Text style={styles.headerSubtitle}>
                  Split expenses with ease!
                </Text>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          closeAllDropdowns();
        }}
        accessible={false}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={true}
            decelerationRate="fast"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={darkMode ? "#D69E2E" : "#8B4513"} // Brown/Gold color pattern
                colors={[darkMode ? Colors.text.accent.dark : Colors.primary]} // Brown/Gold color pattern
                progressBackgroundColor={darkMode ? "#2D3748" : "#FFFFFF"}
                progressViewOffset={120} // Push refresh icon down below header
              />
            }
          >
            <Animated.View
              style={[styles.formContainer, { opacity: fadeAnim }]}
            >
              {/* Expense Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expense Name *</Text>
                <TextInput
                  placeholder="e.g., Dinner at Restaurant"
                  placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                  value={billName}
                  onChangeText={(text) => {
                    // Only allow alphabets, spaces, and common punctuation
                    const cleanedText = text.replace(/[^a-zA-Z\s.,!?-]/g, "");
                    setBillName(cleanedText);
                  }}
                  style={[styles.input, errors.billName && styles.inputError]}
                  returnKeyType="next"
                  onSubmitEditing={() => amountInputRef.current?.focus()}
                  maxLength={50}
                  accessibilityLabel="Expense name input"
                  accessibilityHint="Enter the name of the expense"
                />
                {errors.billName && (
                  <Text style={styles.errorText}>{errors.billName}</Text>
                )}
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount *</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                  <TextInput
                    ref={amountInputRef}
                    placeholder="0.00"
                    placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                    value={billAmount}
                    onChangeText={handleAmountChange}
                    keyboardType="decimal-pad"
                    style={[
                      styles.input,
                      styles.amountInput,
                      { paddingLeft: amountInputPadding },
                      errors.billAmount && styles.inputError,
                    ]}
                    returnKeyType="next"
                    maxLength={10}
                    accessibilityLabel="Amount input"
                    accessibilityHint="Enter the expense amount"
                  />
                </View>
                {errors.billAmount && (
                  <Text style={styles.errorText}>{errors.billAmount}</Text>
                )}
              </View>

              {/* Date Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateButtonText}>
                    📅 {expenseDate.toLocaleDateString()}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={expenseDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() - 2)
                      )
                    }
                    themeVariant={darkMode ? "dark" : "light"}
                  />
                )}
                {showDatePicker && Platform.OS === "ios" && (
                  <Pressable
                    onPress={() => setShowDatePicker(false)}
                    style={styles.datePickerDoneButton}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </Pressable>
                )}
              </View>

              {/* Currency Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Currency</Text>
                <DropDownPicker
                  placeholder="Select currency"
                  open={currencyDropdownOpen}
                  value={currency}
                  items={currencyItems}
                  setOpen={setCurrencyDropdownOpen}
                  setValue={setCurrency}
                  setItems={setCurrencyItems}
                  onOpen={() => {
                    setPayerDropdownOpen(false);
                    setSplitDropdownOpen(false);
                  }}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  zIndex={currencyDropdownOpen ? 3000 : 3}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                  maxHeight={150}
                  dropDownDirection="AUTO"
                  arrowIconStyle={styles.arrowIcon}
                  tickIconStyle={styles.tickIcon}
                />
              </View>

              {/* Payer Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Who paid? *</Text>
                <DropDownPicker
                  placeholder="Select who paid"
                  open={payerDropdownOpen}
                  value={payer}
                  items={payerItems}
                  setOpen={setPayerDropdownOpen}
                  setValue={setPayer}
                  setItems={setPayerItems}
                  onOpen={() => {
                    setSplitDropdownOpen(false);
                    setCurrencyDropdownOpen(false);
                  }}
                  style={[styles.dropdown, errors.payer && styles.inputError]}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  zIndex={payerDropdownOpen ? 2000 : 2}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{
                    nestedScrollEnabled: true,
                    showsVerticalScrollIndicator: true,
                    bounces: true,
                    decelerationRate: "fast",
                  }}
                  maxHeight={250}
                  searchable={true}
                  searchPlaceholder="Search friends..."
                  searchTextInputStyle={styles.searchInput}
                  searchContainerStyle={styles.searchContainer}
                  itemSeparator={true}
                  itemSeparatorStyle={styles.itemSeparator}
                  dropDownDirection="AUTO"
                  arrowIconStyle={styles.arrowIcon}
                  tickIconStyle={styles.tickIcon}
                />
                {errors.payer && (
                  <Text style={styles.errorText}>{errors.payer}</Text>
                )}
              </View>

              {/* Split With Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Split with who? *</Text>

                {/* Recent split partners */}
                {getRecentSplitPartners().length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsLabel}>Recent:</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.suggestionsScrollView}
                    >
                      {getRecentSplitPartners().map((partner) => (
                        <Pressable
                          key={partner.value}
                          style={[
                            styles.suggestionChip,
                            splitWith.includes(partner.value) &&
                              styles.suggestionChipSelected,
                          ]}
                          onPress={() => {
                            if (!splitWith.includes(partner.value)) {
                              setSplitWith([...splitWith, partner.value]);
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light
                              );
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.suggestionChipText,
                              splitWith.includes(partner.value) &&
                                styles.suggestionChipTextSelected,
                            ]}
                          >
                            {partner.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <DropDownPicker
                  placeholder="Select people to split with"
                  multiple={true}
                  open={splitDropdownOpen}
                  value={splitWith}
                  items={splitItems}
                  setOpen={setSplitDropdownOpen}
                  setValue={setSplitWith}
                  setItems={setSplitItems}
                  onOpen={() => {
                    setPayerDropdownOpen(false);
                    setCurrencyDropdownOpen(false);
                  }}
                  style={[
                    styles.dropdown,
                    errors.splitWith && styles.inputError,
                  ]}
                  dropDownContainerStyle={[
                    styles.dropdownContainer,
                    styles.splitDropdownContainer,
                  ]}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  zIndex={splitDropdownOpen ? 1000 : 1}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{
                    nestedScrollEnabled: true,
                    showsVerticalScrollIndicator: true,
                    bounces: true,
                    decelerationRate: "fast",
                    contentInsetAdjustmentBehavior: "automatic",
                  }}
                  maxHeight={300}
                  mode="BADGE"
                  badgeDotStyle={styles.badgeDot}
                  badgeTextStyle={styles.badgeText}
                  searchable={true}
                  searchPlaceholder="Search friends..."
                  searchTextInputStyle={styles.searchInput}
                  searchContainerStyle={styles.searchContainer}
                  itemSeparator={true}
                  itemSeparatorStyle={styles.itemSeparator}
                  dropDownDirection="AUTO"
                  arrowIconStyle={styles.arrowIcon}
                  tickIconStyle={styles.tickIcon}
                />
                {errors.splitWith && (
                  <Text style={styles.errorText}>{errors.splitWith}</Text>
                )}
              </View>

              {/* Split Type Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>How to split?</Text>
                <View style={styles.splitTypeContainer}>
                  <Pressable
                    style={[
                      styles.splitTypeButton,
                      splitType === "equal" && styles.splitTypeActive,
                    ]}
                    onPress={() => handleSplitType("equal")}
                  >
                    <Text
                      style={[
                        styles.splitTypeText,
                        splitType === "equal" && styles.splitTypeTextActive,
                      ]}
                    >
                      Split Equally
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.splitTypeButton,
                      splitType === "custom" && styles.splitTypeActive,
                    ]}
                    onPress={() => handleSplitType("custom")}
                  >
                    <Text
                      style={[
                        styles.splitTypeText,
                        splitType === "custom" && styles.splitTypeTextActive,
                      ]}
                    >
                      Custom Split
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Custom Split Inputs */}
              {splitType === "custom" && splitWith.length > 0 && (
                <CustomSplitInputs />
              )}

              {/* Split Preview */}
              {splitPreview && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewTitle}>Split Preview</Text>
                  <Text style={styles.previewText}>
                    Total: {currencySymbol}
                    {splitPreview.totalAmount}
                  </Text>
                  {splitType === "equal" ? (
                    <Text style={styles.previewText}>
                      {splitPreview.totalPeople} people × {currencySymbol}
                      {splitPreview.amountPerPerson} each
                    </Text>
                  ) : (
                    <ScrollView
                      style={styles.previewBreakdown}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                      contentContainerStyle={{ paddingBottom: 8 }}
                    >
                      {splitPreview.breakdown.map((item, index) => (
                        <View key={index} style={styles.previewRow}>
                          <Text style={styles.previewPerson}>
                            {item.person}
                          </Text>
                          <Text style={styles.previewAmount}>
                            {currencySymbol}
                            {item.amount}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              {/* Photo Upload */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Add Photo (Optional)</Text>
                {billPhoto ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: billPhoto }}
                      style={styles.imagePreview}
                    />
                    <Pressable
                      style={styles.clearImageButton}
                      onPress={handleClearPhoto}
                    >
                      <Text style={styles.clearImageButtonText}>
                        🗑️ Clear Photo
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.imageButton}
                    onPress={handleImagePicker}
                  >
                    <Text style={styles.imageButtonText}>
                      📸 Add Receipt Photo
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Note Field */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Note (Optional)</Text>
                  <Text
                    style={[
                      styles.wordCount,
                      getWordCount(note) > 90 && {
                        color: darkMode ? "#F56565" : "#EF4444",
                      },
                    ]}
                  >
                    {getWordCount(note)}/100
                  </Text>
                </View>
                <TextInput
                  placeholder="Add a note about this expense"
                  placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                  value={note}
                  onChangeText={(text) => {
                    const validation = validateNoteWordCount(text);
                    if (validation.isValid) {
                      setNote(text);
                    }
                  }}
                  style={[styles.input, styles.noteInput]}
                  multiline={true}
                  numberOfLines={3}
                  returnKeyType="done"
                  textAlignVertical="top"
                />
                {getWordCount(note) > 100 && (
                  <Text style={styles.errorText}>
                    Note cannot exceed 100 words
                  </Text>
                )}
              </View>

              {/* Add Expense Button */}
              <Pressable
                style={[
                  styles.addButton,
                  (!isFormValid || isSubmitting) && styles.addButtonDisabled,
                ]}
                onPress={handleAddBill}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Add Expense</Text>
                )}
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

// Production-ready styles with glassmorphism header
const createStyles = (darkMode = false, insets = { top: 0 }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? Colors.background.dark : Colors.background.light,
    },

    // Glassmorphism Header - Like Navigation Bar
    headerContainer: {
      position: "absolute",
      top: insets.top + -5,
      left: 17,
      right: 17,
      zIndex: 1000,
      overflow: "hidden",
    },

    headerBlurView: {
      borderRadius: 5,
      overflow: "hidden",
      backgroundColor: darkMode
        ? "rgba(0, 0, 0, 0.25)"
        : "rgba(255, 255, 255, 0.25)",
      borderWidth: 0.5,
      borderColor: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: darkMode ? 0.4 : 0.15,
      shadowRadius: 40,
      elevation: 20,
    },

    headerContent: {
      padding: 30,
      alignItems: "center",
    },

    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
    },

    // Logo Design with Brown/Gold Color Pattern
    logoContainer: {
      marginRight: 16,
    },

    logoOuter: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: darkMode ? Colors.text.accent.dark : Colors.primary, // Gold/Brown base
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },

    logoInner: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: darkMode ? Colors.secondaryDark : Colors.primaryDark, // Darker brown/gold
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: darkMode ? "#F6E05E" : "#DDD6FE", // Light gold accent
    },

    logoText: {
      fontSize: 16,
      fontWeight: "800",
      color: Colors.white,
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },

    headerEmoji: {
      fontSize: 32,
      marginRight: 12,
    },

    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: darkMode ? Colors.text.accent.dark : Colors.primary, // Brown/Gold color pattern
      marginBottom: 2,
    },

    headerSubtitle: {
      fontSize: 14,
      color: darkMode ? "#FFFFFF" : "#000000", // White in dark mode, black in light mode
      fontWeight: "500",
    },

    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 60,
      paddingTop: 120, // Increased from 100 to push content down more
    },
    formContainer: {
      padding: 20,
      paddingTop: -10,
    },

    // Input Groups
    inputGroup: {
      marginBottom: 15,
    },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    wordCount: {
      fontSize: 14,
      color: darkMode ? "#A0AEC0" : "#6B7280",
      fontWeight: "500",
    },
    label: {
      fontSize: 16,
      paddingBottom: 8,
      fontWeight: "600",
      color: darkMode ? "#FFFFFF" : "#374151",
    },
    input: {
      borderWidth: 1,
      borderColor: darkMode ? "#4A5568" : "#D1D5DB",
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      backgroundColor: darkMode ? "#1A202C" : "#FFFFFF",
      color: darkMode ? "#FFFFFF" : "#374151",
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

    // Amount Input
    amountContainer: {
      position: "relative",
    },
    currencySymbol: {
      position: "absolute",
      left: 16,
      top: 16,
      fontSize: 18,
      fontWeight: "600",
      color: darkMode ? "#D69E2E" : "#8B4513",
      zIndex: 1,
    },
    amountInput: {
      // paddingLeft will be set dynamically
    },

    // Date Button
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: darkMode ? "#4A5568" : "#D1D5DB",
      borderRadius: 12,
      padding: 16,
      backgroundColor: darkMode ? "#1A202C" : "#FFFFFF",
    },
    dateButtonText: {
      fontSize: 16,
      color: darkMode ? "#FFFFFF" : "#374151",
    },
    datePickerDoneButton: {
      alignSelf: "flex-end",
      margin: 10,
      padding: 10,
      backgroundColor: darkMode ? "#D69E2E" : "#8B4513",
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    datePickerDoneText: {
      color: Colors.white,
      fontWeight: "600",
      fontSize: 16,
    },

    // Dropdowns - Matching HistoryScreen style
    dropdown: {
      borderWidth: 1,
      borderColor: darkMode ? "#4A5568" : "#D1D5DB",
      borderRadius: 12,
      backgroundColor: darkMode ? "#1A202C" : "#FFFFFF",
      paddingHorizontal: 16,
      minHeight: 54,
    },
    dropdownContainer: {
      borderWidth: 1,
      borderColor: darkMode ? "#4A5568" : "#D1D5DB",
      borderRadius: 12,
      backgroundColor: darkMode ? "#1A202C" : "#FFFFFF",
    },
    dropdownText: {
      fontSize: 16,
      color: darkMode ? "#FFFFFF" : "#374151",
    },
    dropdownPlaceholder: {
      fontSize: 16,
      color: darkMode ? "#A0AEC0" : "#9CA3AF",
    },
    searchInput: {
      color: darkMode ? "#FFFFFF" : "#374151",
      backgroundColor: darkMode ? "#2D3748" : "#F9FAFB",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
    },
    searchContainer: {
      backgroundColor: darkMode ? "#2D3748" : "#F9FAFB",
      borderBottomColor: darkMode ? "#4A5568" : "#E5E7EB",
      borderBottomWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    itemSeparator: {
      height: 1,
      backgroundColor: darkMode ? "#4A5568" : "#E5E7EB",
    },
    splitDropdownContainer: {
      maxHeight: 300,
    },
    badgeDot: {
      backgroundColor: darkMode ? "#D69E2E" : "#8B4513",
    },
    badgeText: {
      color: Colors.white,
      fontSize: 12,
      fontWeight: "500",
    },
    arrowIcon: {
      tintColor: darkMode ? "#D69E2E" : "#8B4513",
    },
    tickIcon: {
      tintColor: darkMode ? "#D69E2E" : "#8B4513",
    },

    // Recent suggestions
    suggestionsContainer: {
      marginBottom: 12,
    },
    suggestionsLabel: {
      fontSize: 12,
      color: darkMode ? "#A0AEC0" : "#6B7280",
      marginBottom: 8,
      fontWeight: "500",
    },
    suggestionsScrollView: {
      flexDirection: "row",
    },
    suggestionChip: {
      backgroundColor: darkMode ? "#2D3748" : "#F3F4F6",
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      borderWidth: 1,
      borderColor: darkMode ? "#4A5568" : "#E5E7EB",
    },
    suggestionChipSelected: {
      backgroundColor: darkMode ? "#D69E2E" : "#8B4513",
      borderColor: darkMode ? "#D69E2E" : "#8B4513",
    },
    suggestionChipText: {
      fontSize: 12,
      color: darkMode ? "#E2E8F0" : "#6B7280",
      fontWeight: "500",
    },
    suggestionChipTextSelected: {
      color: Colors.white,
    },

    // Split Type Selector
    splitTypeContainer: {
      flexDirection: "row",
      gap: 8,
    },
    splitTypeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: darkMode ? "#2D3748" : "#F3F4F6",
      borderWidth: 1,
      borderColor: darkMode ? "#4A5568" : "#E5E7EB",
      alignItems: "center",
    },
    splitTypeActive: {
      backgroundColor: darkMode ? "#D69E2E" : "#8B4513",
      borderColor: darkMode ? "#D69E2E" : "#8B4513",
    },
    splitTypeText: {
      fontSize: 14,
      fontWeight: "600",
      color: darkMode ? "#E2E8F0" : "#6B7280",
    },
    splitTypeTextActive: {
      color: Colors.white,
    },

    // Custom Split Inputs
    customSplitContainer: {
      marginTop: 16,
      padding: 16,
      backgroundColor: darkMode ? "#374151" : "#F9FAFB",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: darkMode ? "#4B5563" : "#E5E7EB",
    },
    customSplitLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: darkMode ? "#FFFFFF" : "#374151",
      marginBottom: 12,
    },
    customSplitRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    customSplitName: {
      fontSize: 16,
      fontWeight: "500",
      color: darkMode ? "#FFFFFF" : "#374151",
      flex: 1,
    },
    customSplitInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      position: "relative",
    },
    customSplitPrefix: {
      fontSize: 16,
      fontWeight: "600",
      color: darkMode ? "#D69E2E" : "#8B4513",
      marginRight: 8,
    },
    customSplitInput: {
      borderWidth: 1,
      borderColor: darkMode ? "#4A5568" : "#D1D5DB",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 14,
      backgroundColor: darkMode ? "#374151" : "#FFFFFF",
      color: darkMode ? "#F9FAFB" : "#374151",
      width: 80,
      textAlign: "right",
    },
    customSplitTotal: {
      fontSize: 12,
      color: darkMode ? "#D69E2E" : "#8B4513",
      textAlign: "center",
      marginTop: 8,
      fontWeight: "600",
    },

    // Split Preview
    previewContainer: {
      backgroundColor: darkMode ? "#2D3748" : "#F8FAFC",
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: darkMode ? "#4A5568" : "#E5E7EB",
    },
    previewTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: darkMode ? "#FFFFFF" : "#374151",
      marginBottom: 8,
    },
    previewText: {
      fontSize: 14,
      color: darkMode ? "#CBD5E0" : "#6B7280",
      marginBottom: 4,
    },
    previewBreakdown: {
      marginTop: 8,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    previewPerson: {
      fontSize: 14,
      color: darkMode ? "#CBD5E0" : "#6B7280",
      flex: 1,
    },
    previewAmount: {
      fontSize: 14,
      fontWeight: "600",
      color: darkMode ? "#D69E2E" : "#8B4513",
    },

    // Image Upload - Smaller width
    imageButton: {
      borderWidth: 2,
      borderColor: darkMode ? "#4A5568" : "#D1D5DB",
      borderStyle: "dashed",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      backgroundColor: darkMode ? "#2D3748" : "#F9FAFB",
      alignSelf: "center",
      minWidth: 200,
      maxWidth: 250,
    },
    imageButtonText: {
      fontSize: 14,
      color: darkMode ? "#A0AEC0" : "#6B7280",
      fontWeight: "500",
    },
    imagePreviewContainer: {
      alignItems: "center",
    },
    imagePreview: {
      width: 200,
      height: 150,
      borderRadius: 12,
      marginBottom: 12,
    },
    clearImageButton: {
      backgroundColor: darkMode ? "#E53E3E" : "#EF4444",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    clearImageButtonText: {
      color: Colors.white,
      fontSize: 14,
      fontWeight: "600",
    },

    // Note Input
    noteInput: {
      height: 80,
      textAlignVertical: "top",
    },

    // Add Button - Properly styled
    addButton: {
      backgroundColor: darkMode ? "#D69E2E" : "#8B4513",
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 8,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    addButtonDisabled: {
      backgroundColor: darkMode ? "#4A5568" : "#9CA3AF",
      opacity: 0.6,
    },
    addButtonText: {
      color: Colors.white,
      fontSize: 18,
      fontWeight: "700",
    },
  });

export default BillsScreen;
