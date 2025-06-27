import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  FlatList,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  currencyOptions,
  getFriendsDropdownOptions,
  getCurrencySymbol,
} from "../utils/helpers";
import styles from "../styles/BillScreenStyles";

const BillsScreen = ({ friends, addBill, profileName, recentBills = [] }) => {
  const you = profileName?.trim() || "You";
  const fullFriendsList = useMemo(
    () => getFriendsDropdownOptions(friends, you),
    [friends, you]
  );

  // Core states
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [payer, setPayer] = useState(null);
  const [splitWith, setSplitWith] = useState([]);
  const [note, setNote] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Enhanced features states
  const [billPhoto, setBillPhoto] = useState(null);
  const [splitType, setSplitType] = useState("equal");
  const [customSplits, setCustomSplits] = useState({});
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Dropdown states and items
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false);
  const [payerDropdownOpen, setPayerDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [splitItems, setSplitItems] = useState(fullFriendsList);
  const [payerItems, setPayerItems] = useState(fullFriendsList);
  const [currencyItems, setCurrencyItems] = useState(currencyOptions);

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);
  const amountInputRef = useRef(null);

  // Update dropdown items when friends change
  useEffect(() => {
    setSplitItems(fullFriendsList);
    setPayerItems(fullFriendsList);
  }, [fullFriendsList]);

  // Animate in
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Custom splits setup
  useEffect(() => {
    if (splitType !== "equal") {
      const participants = Array.from(new Set([payer, ...splitWith])).filter(
        Boolean
      );
      setCustomSplits((prev) => {
        const newSplits = { ...prev };
        participants.forEach((p) => {
          if (!(p in newSplits)) {
            newSplits[p] = "";
          }
        });
        Object.keys(newSplits).forEach((p) => {
          if (!participants.includes(p)) {
            delete newSplits[p];
          }
        });
        return newSplits;
      });
    } else {
      setCustomSplits({});
    }
    // eslint-disable-next-line
  }, [splitType, splitWith, payer]);

  // Error clearing
  useEffect(() => {
    if (errors.billName && billName.trim())
      setErrors((e) => ({ ...e, billName: null }));
  }, [billName]);
  useEffect(() => {
    if (errors.billAmount && billAmount && !isNaN(parseFloat(billAmount)))
      setErrors((e) => ({ ...e, billAmount: null }));
  }, [billAmount]);
  useEffect(() => {
    if (errors.payer && payer) setErrors((e) => ({ ...e, payer: null }));
  }, [payer]);
  useEffect(() => {
    if (errors.splitWith && splitWith.length > 0)
      setErrors((e) => ({ ...e, splitWith: null }));
  }, [splitWith]);

  const amountInputPadding = useMemo(() => {
    const length = currencySymbol?.length || 1;
    return length === 1 ? 35 : length === 2 ? 45 : 60;
  }, [currencySymbol]);

  const handleAmountChange = (text) => {
    const cleanText = text.replace(/[^0-9.]/g, "");
    const parts = cleanText.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) {
      setBillAmount(parts[0] + "." + parts[1].substring(0, 2));
    } else {
      setBillAmount(cleanText);
    }
  };

  const handleCustomSplitChange = useCallback(
    (participant, value) => {
      const cleanValue = value.replace(/[^0-9.]/g, "");
      if (customSplits[participant] !== cleanValue) {
        setCustomSplits((prev) => ({
          ...prev,
          [participant]: cleanValue,
        }));
      }
    },
    [customSplits]
  );

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
    setCustomSplits({});
    setExpenseDate(new Date());
    setErrors({});
    closeAllDropdowns();
  }, [closeAllDropdowns]);

  const validate = useCallback(() => {
    const e = {};
    if (!billName.trim()) e.billName = "Required";
    const amt = parseFloat(billAmount);
    if (!billAmount) e.billAmount = "Required";
    else if (isNaN(amt)) e.billAmount = "Invalid";
    else if (amt <= 0) e.billAmount = "Must be > 0";
    if (!payer) e.payer = "Select payer";
    if (!splitWith.length) e.splitWith = "Select participants";
    if (splitType !== "equal") {
      const pts = Array.from(new Set([payer, ...splitWith])).filter(Boolean);
      const sum = pts.reduce((s, p) => s + parseFloat(customSplits[p] || 0), 0);
      if (
        (splitType === "exact" && Math.abs(sum - amt) > 0.01) ||
        (splitType === "percentage" && Math.abs(sum - 100) > 0.01)
      ) {
        e.customSplits = "Values must add up correctly";
      }
    }
    setErrors(e);
    return !Object.keys(e).length;
  }, [billName, billAmount, payer, splitWith, splitType, customSplits]);

  const handleAdd = useCallback(async () => {
    closeAllDropdowns();
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const participants = Array.from(new Set([payer, ...splitWith])).filter(
        Boolean
      );
      const splitAmounts = {};
      const amt = parseFloat(billAmount);
      if (splitType === "equal") {
        const per = amt / participants.length;
        participants.forEach((p) => (splitAmounts[p] = per));
      } else if (splitType === "exact") {
        participants.forEach(
          (p) => (splitAmounts[p] = parseFloat(customSplits[p] || 0))
        );
      } else {
        participants.forEach(
          (p) =>
            (splitAmounts[p] = (amt * parseFloat(customSplits[p] || 0)) / 100)
        );
      }
      const newBill = {
        id: Date.now().toString(),
        name: billName.trim(),
        amount: amt.toFixed(2),
        currency,
        payer,
        splitWith: participants,
        splitType,
        splitAmounts,
        date: expenseDate.toISOString(),
        note: note.trim(),
        photoUri: billPhoto,
        createdAt: new Date().toISOString(),
      };
      await addBill(newBill);
      await AsyncStorage.setItem("lastAddedBill", JSON.stringify(newBill));
      resetForm();
      Alert.alert("Success", "Expense added", [
        {
          text: "Undo",
          onPress: () => {},
          style: "destructive",
        },
        { text: "OK" },
      ]);
    } catch {
      Alert.alert("Error", "Could not add expense");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    closeAllDropdowns,
    validate,
    payer,
    splitWith,
    billAmount,
    splitType,
    customSplits,
    currency,
    expenseDate,
    note,
    billPhoto,
    addBill,
    resetForm,
    billName,
  ]);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // <-- reverted to old style
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setBillPhoto(result.assets[0].uri);
    }
  }, []);

  const launchCamera = useCallback(async () => {
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // <-- reverted to old style
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setBillPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to launch camera. Please try again.");
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
    if (!billAmount || !splitWith.length || isNaN(parseFloat(billAmount))) {
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
    } else {
      preview.breakdown = participants.map((p) => {
        let personAmount;
        if (splitType === "exact") {
          personAmount = parseFloat(customSplits[p] || 0);
        } else if (splitType === "percentage") {
          personAmount = (amount * parseFloat(customSplits[p] || 0)) / 100;
        }
        return {
          person: fullFriendsList.find((f) => f.value === p)?.label || p,
          amount: personAmount.toFixed(2),
        };
      });
    }
    return preview;
  }, [billAmount, splitWith, payer, splitType, customSplits, fullFriendsList]);

  // Custom split inputs
  const participants = useMemo(
    () => [...new Set([payer, ...splitWith])].filter(Boolean).sort(),
    [payer, splitWith]
  );

  const CustomSplitInputRow = React.memo(
    ({ participant, value, onChange, prefix, label }) => {
      const [localValue, setLocalValue] = React.useState(value);

      useEffect(() => {
        setLocalValue(value);
      }, [value]);

      return (
        <View style={styles.customSplitRow}>
          <Text style={styles.customSplitName}>{label}</Text>
          <View style={styles.customSplitInputContainer}>
            {prefix ? (
              <Text style={styles.customSplitPrefix}>{prefix}</Text>
            ) : null}
            <TextInput
              value={localValue}
              onChangeText={setLocalValue}
              onBlur={() => onChange(localValue)}
              keyboardType="decimal-pad"
              style={styles.customSplitInput}
              placeholder="0"
              accessibilityLabel={`Split amount for ${label}`}
            />
          </View>
        </View>
      );
    }
  );

  const CustomSplitInputs = React.memo(function CustomSplitInputs({
    participants,
    fullFriendsList,
    splitType,
    currencySymbol,
    customSplits,
    handleCustomSplitChange,
    errors,
  }) {
    return (
      <View style={styles.customSplitContainer}>
        <FlatList
          data={participants}
          keyExtractor={(participant) => participant}
          renderItem={({ item: participant }) => {
            const friendLabel =
              fullFriendsList.find((f) => f.value === participant)?.label ||
              participant;
            const prefix =
              splitType === "percentage"
                ? "%"
                : splitType === "exact"
                ? currencySymbol
                : "";
            return (
              <CustomSplitInputRow
                participant={participant}
                value={customSplits[participant] ?? ""}
                onChange={(value) =>
                  handleCustomSplitChange(participant, value)
                }
                prefix={prefix}
                label={friendLabel}
              />
            );
          }}
          scrollEnabled={false}
          keyboardShouldPersistTaps="always"
          removeClippedSubviews={true}
          initialNumToRender={5}
          windowSize={5}
        />
        {errors.customSplits && (
          <Text style={styles.errorText}>{errors.customSplits}</Text>
        )}
      </View>
    );
  });

  const handleSplitType = useCallback((type) => {
    setSplitType(type);
    if (type === "equal") setCustomSplits({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSplitTypePress = useCallback(
    (type) => () => handleSplitType(type),
    [handleSplitType]
  );

  const handleDateChange = useCallback((event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event?.type === "set" && selectedDate) {
        setExpenseDate(selectedDate);
      }
    } else {
      if (selectedDate) setExpenseDate(selectedDate);
    }
  }, []);

  const handleDateDone = useCallback(() => setShowDatePicker(false), []);

  const isAmountValid = useMemo(() => {
    const amt = parseFloat(billAmount);
    return billAmount && !isNaN(amt) && amt > 0;
  }, [billAmount]);

  useEffect(() => {
    if (!isAmountValid && splitType !== "equal") {
      setSplitType("equal");
    }
  }, [isAmountValid, splitType]);

  // Prevent payer from being selected in splitWith
  useEffect(() => {
    if (payer && splitWith.includes(payer)) {
      setSplitWith((prev) => prev.filter((p) => p !== payer));
    }
  }, [payer, splitWith]);

  // Disable Add Expense button unless form is valid
  const isFormValid = useMemo(() => {
    const amt = parseFloat(billAmount);
    if (!billName.trim()) return false;
    if (!billAmount || isNaN(amt) || amt <= 0) return false;
    if (!payer) return false;
    if (!splitWith.length) return false;
    if (splitType !== "equal") {
      const pts = Array.from(new Set([payer, ...splitWith])).filter(Boolean);
      const sum = pts.reduce((s, p) => s + parseFloat(customSplits[p] || 0), 0);
      if (
        (splitType === "exact" && Math.abs(sum - amt) > 0.01) ||
        (splitType === "percentage" && Math.abs(sum - 100) > 0.01)
      ) {
        return false;
      }
    }
    return true;
  }, [billName, billAmount, payer, splitWith, splitType, customSplits]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          closeAllDropdowns();
        }}
        accessible={false}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[styles.formContainer, { opacity: fadeAnim }]}
            >
              {/* Header */}
              <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                  <View style={styles.headerIconContainer}>
                    <Text style={styles.headerIcon}>💰</Text>
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Bill Buddy</Text>
                    <Text style={styles.headerSubtitle}>
                      Split expenses with ease
                    </Text>
                  </View>
                </View>
                <View style={styles.headerAccent} />
              </View>

              {/* Expense Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expense Name *</Text>
                <TextInput
                  placeholder="e.g., Dinner at Restaurant"
                  value={billName}
                  onChangeText={setBillName}
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
                  onPress={useCallback(
                    () => setShowDatePicker((prev) => !prev),
                    []
                  )}
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
                  />
                )}
                {showDatePicker && Platform.OS === "ios" && (
                  <Pressable
                    onPress={handleDateDone}
                    style={{
                      alignSelf: "flex-end",
                      margin: 10,
                      padding: 10,
                      backgroundColor: "#1976D2",
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Done
                    </Text>
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
                  onOpen={useCallback(() => {
                    setPayerDropdownOpen(false);
                    setSplitDropdownOpen(false);
                  }, [])}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  zIndex={currencyDropdownOpen ? 3000 : 3}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{ nestedScrollEnabled: true }}
                  maxHeight={150}
                  dropDownDirection="AUTO"
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
                  onOpen={useCallback(() => {
                    setSplitDropdownOpen(false);
                    setCurrencyDropdownOpen(false);
                  }, [])}
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
                />
                {errors.payer && (
                  <Text style={styles.errorText}>{errors.payer}</Text>
                )}
              </View>

              {/* Split With Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Split with who? *</Text>
                {getRecentSplitPartners().length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsLabel}>Recent:</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {getRecentSplitPartners().map((partner) => {
                        const onPressPartner = () => {
                          if (!splitWith.includes(partner.value)) {
                            setSplitWith((prev) => [...prev, partner.value]);
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                          }
                        };
                        return (
                          <Pressable
                            key={partner.value}
                            style={[
                              styles.suggestionChip,
                              splitWith.includes(partner.value) &&
                                styles.suggestionChipSelected,
                            ]}
                            onPress={onPressPartner}
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
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <DropDownPicker
                  placeholder="Select people to split with"
                  multiple={true}
                  max={null}
                  open={splitDropdownOpen}
                  value={splitWith}
                  items={splitItems}
                  setOpen={setSplitDropdownOpen}
                  setValue={setSplitWith}
                  setItems={setSplitItems}
                  onOpen={useCallback(() => {
                    setPayerDropdownOpen(false);
                    setCurrencyDropdownOpen(false);
                  }, [])}
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
                />
                {errors.splitWith && (
                  <Text style={styles.errorText}>{errors.splitWith}</Text>
                )}
              </View>

              {/* Split Type Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>How to split?</Text>
                <View style={styles.splitTypeRow}>
                  {["equal", "exact", "percentage"].map((type) => {
                    const isDisabled =
                      (type === "exact" || type === "percentage") &&
                      !isAmountValid;
                    return (
                      <Pressable
                        key={type}
                        style={[
                          styles.splitTypeButton,
                          splitType === type && styles.splitTypeActive,
                          isDisabled && styles.splitTypeDisabled,
                        ]}
                        onPress={
                          !isDisabled ? handleSplitTypePress(type) : undefined
                        }
                        disabled={isDisabled}
                      >
                        <Text
                          style={[
                            styles.splitTypeText,
                            splitType === type && styles.splitTypeTextActive,
                            isDisabled && styles.splitTypeTextDisabled,
                          ]}
                        >
                          {type === "equal"
                            ? "Equal"
                            : type === "exact"
                            ? "Exact"
                            : "By %"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!isAmountValid && (
                  <Text style={styles.splitTypeHelperText}>
                    Enter amount first to use "Exact" or "By %"
                  </Text>
                )}
              </View>

              {/* Inline Custom Split Inputs */}
              {splitType !== "equal" && splitWith.length > 0 && (
                <CustomSplitInputs
                  participants={participants}
                  fullFriendsList={fullFriendsList}
                  splitType={splitType}
                  currencySymbol={currencySymbol}
                  customSplits={customSplits}
                  handleCustomSplitChange={handleCustomSplitChange}
                  errors={errors}
                />
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
                    <View style={styles.previewBreakdown}>
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
                    </View>
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
                    style={styles.imagePickerButton}
                    onPress={handleImagePicker}
                  >
                    <Text style={styles.imagePickerButtonText}>
                      📸 Upload Receipt / Photo
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Note Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Note (Optional)</Text>
                <TextInput
                  placeholder="Add a note about this expense"
                  value={note}
                  onChangeText={setNote}
                  style={[styles.input, styles.noteInput]}
                  multiline={true}
                  numberOfLines={2}
                  returnKeyType="done"
                  maxLength={200}
                />
                <Text style={styles.characterCount}>{note.length}/200</Text>
              </View>

              {/* Add Expense Button */}
              <Pressable
                style={[
                  styles.addButton,
                  (isSubmitting || !isFormValid) && styles.addButtonDisabled,
                ]}
                onPress={handleAdd}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Add Expense</Text>
                )}
              </Pressable>
              {!isFormValid && (
                <Text style={styles.formErrorText}>
                  Please fill all required fields and ensure splits add up
                  correctly.
                </Text>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default BillsScreen;
