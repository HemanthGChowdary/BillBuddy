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
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
  ActionSheetIOS,
  ScrollView,
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

const BillsScreen = ({ friends, addBill, profileName, recentBills = [] }) => {
  const you = profileName?.trim() || "You";
  const [firstTme, setFirstTime] = useState(true);
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
  const fadeAnim = useState(new Animated.Value(0))[0];

  const [percentageSplits, setPercentageSplits] = useState({});
  // Enhanced features states
  const [billPhoto, setBillPhoto] = useState(null);
  const [splitType, setSplitType] = useState("equal");
  const [customSplits, setCustomSplits] = useState({});
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastAddedBill, setLastAddedBill] = useState(null);

  // Dropdown states
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false);
  const [payerDropdownOpen, setPayerDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  // Items for dropdowns
  const [payerItems, setPayerItems] = useState(fullFriendsList);
  const [splitItems, setSplitItems] = useState(fullFriendsList);
  const [currencyItems, setCurrencyItems] = useState(currencyOptions);

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);
  const amountInputRef = useRef(null);
  const amountInputPadding = useMemo(() => {
    const length = currencySymbol?.length || 1;
    return length === 1 ? 35 : length === 2 ? 45 : 60;
  }, [currencySymbol]);

  // Get recent split partners
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

  // Initialize custom splits when participants change
  useEffect(() => {
    if (splitType !== "equal" && splitWith.length > 0) {
      const participants = [...new Set([payer, ...splitWith])].filter(Boolean);
      const newCustomSplits = {};

      participants.forEach((participant) => {
        if (!customSplits[participant]) {
          if (splitType === "percentage") {
            newCustomSplits[participant] = Math.floor(
              100 / participants.length
            ).toString();
          } else if (splitType === "exact") {
            const total = parseFloat(billAmount) || 0;
            newCustomSplits[participant] = (
              total / participants.length
            ).toFixed(2);
          }
        } else {
          newCustomSplits[participant] = customSplits[participant];
        }
      });

      setCustomSplits(newCustomSplits);
    }
  }, [splitWith, payer, splitType, billAmount]);

  // Animation and setup effects
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    setPayerItems([...fullFriendsList]);
    setSplitItems([...fullFriendsList]);
  }, [fullFriendsList]);

  useEffect(() => {
    setCurrencyItems([...currencyOptions]);
  }, []);

  // Error clearing effects
  useEffect(() => {
    if (errors.billName && billName.trim()) {
      setErrors((prev) => ({ ...prev, billName: null }));
    }
  }, [billName, errors.billName]);

  useEffect(() => {
    if (
      errors.billAmount &&
      billAmount.trim() &&
      !isNaN(parseFloat(billAmount))
    ) {
      setErrors((prev) => ({ ...prev, billAmount: null }));
    }
  }, [billAmount, errors.billAmount]);

  useEffect(() => {
    if (errors.payer && payer) {
      setErrors((prev) => ({ ...prev, payer: null }));
    }
  }, [payer, errors.payer]);

  useEffect(() => {
    if (errors.splitWith && splitWith.length > 0) {
      setErrors((prev) => ({ ...prev, splitWith: null }));
    }
  }, [splitWith, errors.splitWith]);

  // Form reset when friends/profile changes
  useEffect(() => {
    resetForm();
    setPayerItems([...fullFriendsList]);
    setSplitItems([...fullFriendsList]);
  }, [friends, profileName, fullFriendsList]);

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

  // Enhanced validation
  const validateForm = () => {
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
    if (splitType !== "equal") {
      const participants = [...new Set([payer, ...splitWith])].filter(Boolean);

      if (splitType === "exact") {
        const sum = participants.reduce(
          (acc, p) => acc + parseFloat(customSplits[p] || 0),
          0
        );
        if (Math.abs(sum - amount) > 0.01) {
          newErrors.customSplits = "Split amounts don't match total";
        }
      } else if (splitType === "percentage") {
        const sum = participants.reduce(
          (acc, p) => acc + parseFloat(customSplits[p] || 0),
          0
        );
        if (Math.abs(sum - 100) > 0.01) {
          newErrors.customSplits = "Percentages must add up to 100%";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleCustomSplitChange = (participant, value) => {
    const cleanValue = value.replace(/[^0-9.]/g, "");
    setCustomSplits((prev) => ({
      ...prev,
      [participant]: cleanValue,
    }));
    // console.log(value);
  };

  // Image handling
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setBillPhoto(result.assets[0].uri);
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setBillPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera launch failed:", error);
      Alert.alert("Error", "Unable to launch camera. Please try again.");
    }
  };

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
  }, [closeAllDropdowns]);

  const handleClearPhoto = useCallback(() => {
    setBillPhoto(null);
  }, []);

  // Undo functionality
  const undoLastBill = async () => {
    if (lastAddedBill) {
      Alert.alert("Undo", "Bill removed successfully");
      setLastAddedBill(null);
    }
  };

  const handleAddBill = async () => {
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
      } else if (splitType === "exact") {
        splitAmounts = { ...customSplits };
      } else if (splitType === "percentage") {
        participants.forEach((p) => {
          splitAmounts[p] = (amount * parseFloat(customSplits[p] || 0)) / 100;
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
          { text: "Undo", onPress: undoLastBill, style: "destructive" },
          { text: "Great!", style: "default" },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memoized split preview
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

  const DATA = [
    {
      id: "bd7acbea-c1b1-46c2-aed5",
      title: "Primary Bill component",
    },
  ];

  const BillScreenItems = () => {
    return (
      <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
        {/* Enhanced Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Text style={styles.appTitle}>💰 Bill Buddy</Text>
            <Text style={styles.headerSubtitle}>
              Smart expense splitting made simple
            </Text>
            <View style={styles.headerAccent} />
          </View>
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
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS !== "ios");
                if (selectedDate) {
                  setExpenseDate(selectedDate);
                }
              }}
              maximumDate={new Date()}
            />
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
          />
          {errors.payer && <Text style={styles.errorText}>{errors.payer}</Text>}
        </View>

        {/* Split With Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Split with who? *</Text>

          {/* Recent split partners */}
          {getRecentSplitPartners().length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Recent:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            style={[styles.dropdown, errors.splitWith && styles.inputError]}
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
          <View style={styles.splitTypeContainer}>
            {["equal", "exact", "percentage"].map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.splitTypeButton,
                  splitType === type && styles.splitTypeActive,
                ]}
                onPress={() => {
                  setSplitType(type);
                  if (type === "equal") setCustomSplits({});
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.splitTypeText,
                    splitType === type && styles.splitTypeTextActive,
                  ]}
                >
                  {type === "equal"
                    ? "Equal"
                    : type === "exact"
                    ? "Exact"
                    : "By %"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Custom Split Inputs */}
        {splitType !== "equal" && splitWith.length > 0 && <CustomSplitInputs />}

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
                    <Text style={styles.previewPerson}>{item.person}</Text>
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
              <Image source={{ uri: billPhoto }} style={styles.imagePreview} />
              <Pressable
                style={styles.clearImageButton}
                onPress={handleClearPhoto}
              >
                <Text style={styles.clearImageButtonText}>🗑️ Clear Photo</Text>
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

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
            isSubmitting && styles.addButtonDisabled,
          ]}
          onPress={handleAddBill}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.addButtonText}>Adding...</Text>
            </View>
          ) : (
            <Text style={styles.addButtonText}>✅ Add Expense</Text>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  // Custom split inputs component
  const CustomSplitInputs = () => {
    const participants = [...new Set([payer, ...splitWith])].filter(Boolean);

    return (
      <View style={styles.customSplitContainer}>
        {participants.map((participant) => {
          const friendLabel =
            fullFriendsList.find((f) => f.value === participant)?.label ||
            participant;
          return (
            <View key={participant} style={styles.customSplitRow}>
              <Text style={styles.customSplitName}>{friendLabel}</Text>
              <View style={styles.customSplitInputContainer}>
                {splitType === "percentage" && (
                  <Text style={styles.customSplitPrefix}>%</Text>
                )}
                {splitType === "exact" && (
                  <Text style={styles.customSplitPrefix}>{currencySymbol}</Text>
                )}
                {splitType === "percentage" ? (
                  <TextInput
                    value={percentageSplits[participant] ?? ""}
                    onChangeText={(value) =>
                      setPercentageSplits((prev) => ({
                        ...prev,
                        [participant]: value,
                      }))
                    }
                    keyboardType="decimal-pad"
                    style={styles.customSplitInput}
                    placeholder="0"
                    accessibilityLabel={`Split amount for ${friendLabel}`}
                  />
                ) : (
                  <TextInput
                    value={customSplits[participant] ?? ""}
                    onChangeText={(value) =>
                      handleCustomSplitChange(participant, value)
                    }
                    keyboardType="decimal-pad"
                    style={styles.customSplitInput}
                    placeholder="0"
                    accessibilityLabel={`Split amount for ${friendLabel}`}
                  />
                )}
              </View>
            </View>
          );
        })}
        {errors.customSplits && (
          <Text style={styles.errorText}>{errors.customSplits}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          closeAllDropdowns();
        }}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <FlatList
            data={DATA}
            renderItem={() => <BillScreenItems />}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default BillsScreen;

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#EFE4D2",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  formContainer: {
    padding: 20,
  },

  // Enhanced Header Styles
  headerContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    padding: 24,
    alignItems: "center",
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1976D2",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  headerAccent: {
    width: 60,
    height: 4,
    backgroundColor: "#1976D2",
    borderRadius: 2,
  },

  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputError: {
    borderColor: "#F44336",
    borderWidth: 2,
  },
  errorText: {
    color: "#F44336",
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  currencySymbol: {
    position: "absolute",
    left: 16,
    fontSize: 16,
    color: "#666",
    zIndex: 1,
    top: Platform.OS === "ios" ? 18 : 16,
  },
  amountInput: {
    paddingLeft: 60,
    flex: 1,
  },

  // Date Button Styles
  dateButton: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },

  noteInput: {
    height: 80,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },

  // Suggestions Styles
  suggestionsContainer: {
    marginBottom: 12,
  },
  suggestionsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  suggestionChip: {
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  suggestionChipSelected: {
    backgroundColor: "#1976D2",
    borderColor: "#1976D2",
  },
  suggestionChipText: {
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "500",
  },
  suggestionChipTextSelected: {
    color: "#fff",
  },

  previewContainer: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#1976D2",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: "#1976D2",
    marginBottom: 4,
  },
  previewBreakdown: {
    marginTop: 10,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  previewPerson: {
    fontSize: 14,
    color: "#1976D2",
  },
  previewAmount: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "600",
  },

  dropdown: {
    borderColor: "#E0E0E0",
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: "#fff",
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownContainer: {
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownPlaceholder: {
    color: "#999",
    fontSize: 16,
  },
  badgeDot: {
    backgroundColor: "#1976D2",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
  },
  splitDropdownContainer: {
    maxHeight: 300,
  },
  searchContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#f8f9fa",
  },
  itemSeparator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 10,
  },

  // Split Type Styles
  splitTypeContainer: {
    flexDirection: "row",
    gap: 10,
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  splitTypeActive: {
    backgroundColor: "#1976D2",
    borderColor: "#1976D2",
  },
  splitTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  splitTypeTextActive: {
    color: "#fff",
  },

  // Custom Split Styles
  customSplitContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  customSplitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  customSplitName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  customSplitInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  customSplitPrefix: {
    marginRight: 5,
    fontSize: 14,
    color: "#666",
  },
  customSplitInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    width: 80,
    textAlign: "center",
  },

  // Image Styles
  imagePickerButton: {
    backgroundColor: "#673AB7",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    backgroundColor: "#F44336",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  clearImageButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Button Styles
  addButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 5,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonPressed: {
    backgroundColor: "#45A049",
    transform: [{ scale: 0.98 }],
  },
  addButtonDisabled: {
    backgroundColor: "#CCCCCC",
    shadowOpacity: 0.1,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
};
