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
  FlatList,
  Pressable,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActionSheetIOS,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { Colors } from "../styles/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import {
  getCurrencySymbol,
  validateNoteWordCount,
  getWordCount,
} from "../utils/helpers";
import { 
  requestCameraPermissionWithEducation, 
  requestMediaLibraryPermissionWithEducation 
} from "../utils/permissions";

// Constants for magic numbers
const CONSTANTS = {
  // Input validation
  MAX_NAME_LENGTH: 50,
  MAX_NOTE_LENGTH: 500,
  MAX_AMOUNT_LENGTH: 10,
  MAX_SEARCH_LENGTH: 100,
  MAX_CUSTOM_SPLIT_LENGTH: 8,
  MAX_PERCENTAGE_LENGTH: 3,
  MIN_NAME_LENGTH: 2,
  MAX_AMOUNT_VALUE: 999999.99,
  MIN_AMOUNT_VALUE: 0.01,
  MAX_PERCENTAGE: 100,
  PERCENTAGE_TOLERANCE: 105, // 5% tolerance for percentage splits

  // UI dimensions
  ICON_SIZE_SMALL: 16,
  ICON_SIZE_MEDIUM: 20,
  ICON_SIZE_LARGE: 24,
  ICON_SIZE_XL: 48,
  ICON_SIZE_XXL: 64,

  // Spacing
  SPACING_XS: 4,
  SPACING_SM: 8,
  SPACING_MD: 12,
  SPACING_LG: 16,
  SPACING_XL: 20,
  SPACING_XXL: 24,

  // Border radius
  BORDER_RADIUS_SM: 8,
  BORDER_RADIUS_MD: 12,
  BORDER_RADIUS_LG: 16,
  BORDER_RADIUS_XL: 20,

  // Opacity values
  OPACITY_DISABLED: 0.6,
  OPACITY_PRESSED: 0.9,
  OPACITY_LIGHT: 0.7,

  // Animation durations
  ANIMATION_DURATION_SHORT: 100,
  ANIMATION_DURATION_MEDIUM: 300,
  ANIMATION_DURATION_LONG: 600,

  // List rendering
  MAX_RENDER_BATCH: 10,
  WINDOW_SIZE: 10,
  INITIAL_NUM_TO_RENDER: 8,

  // Image quality
  IMAGE_QUALITY_HIGH: 1,
  IMAGE_QUALITY_MEDIUM: 0.8,
  IMAGE_ASPECT_RATIO: [4, 3],

  // Z-index values
  Z_INDEX_DROPDOWN_HIGH: 4000,
  Z_INDEX_DROPDOWN_MEDIUM: 3500,
  Z_INDEX_DROPDOWN_LOW: 3000,
  Z_INDEX_DROPDOWN_LOWEST: 2000,
};

// Security utility functions for input sanitization
const sanitizeTextInput = (input, maxLength = CONSTANTS.MAX_SEARCH_LENGTH) => {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>"'&]/g, "") // Remove potentially dangerous characters
    .replace(/[\r\n\t]/g, " ") // Replace newlines and tabs with spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim()
    .substring(0, maxLength);
};

const sanitizeNumericInput = (
  input,
  maxLength = CONSTANTS.MAX_AMOUNT_LENGTH
) => {
  if (typeof input !== "string") return "";
  return input
    .replace(/[^0-9.]/g, "") // Only allow numbers and decimal point
    .substring(0, maxLength);
};

const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return (
    !isNaN(num) &&
    num >= CONSTANTS.MIN_AMOUNT_VALUE &&
    num <= CONSTANTS.MAX_AMOUNT_VALUE &&
    /^\d+(\.\d{1,2})?$/.test(amount)
  );
};

// Validation utility functions for better code organization
const validateExpenseName = (name) => {
  return (
    name &&
    typeof name === "string" &&
    name.trim().length >= CONSTANTS.MIN_NAME_LENGTH
  );
};

const validatePayer = (payer) => {
  return payer && typeof payer === "string" && payer.trim().length > 0;
};

const validateSplitGroup = (splitGroup) => {
  return (
    Array.isArray(splitGroup) &&
    splitGroup.length > 0 &&
    splitGroup.every((person) => person && typeof person === "string")
  );
};

const validateCustomSplitAmount = (amount) => {
  return amount >= 0 && amount <= CONSTANTS.MAX_AMOUNT_VALUE;
};

// Additional data validation and sanitization functions
const validateBillData = (bill) => {
  if (!bill || typeof bill !== "object") return false;

  // Required fields validation
  if (!bill.id || typeof bill.id !== "string") return false;
  if (
    !bill.name ||
    typeof bill.name !== "string" ||
    bill.name.trim().length === 0
  )
    return false;
  if (!bill.amount || isNaN(parseFloat(bill.amount))) return false;
  if (!bill.payer || typeof bill.payer !== "string") return false;
  if (!bill.createdAt || isNaN(new Date(bill.createdAt).getTime()))
    return false;

  // Optional fields validation
  if (bill.splitWith && !Array.isArray(bill.splitWith)) return false;
  if (bill.splitAmounts && typeof bill.splitAmounts !== "object") return false;

  return true;
};

const sanitizeBillData = (bill) => {
  if (!validateBillData(bill)) {
    return null;
  }

  return {
    ...bill,
    id: String(bill.id),
    name: sanitizeTextInput(bill.name, CONSTANTS.MAX_NAME_LENGTH),
    amount: sanitizeNumericInput(
      String(bill.amount),
      CONSTANTS.MAX_AMOUNT_LENGTH
    ),
    payer: sanitizeTextInput(bill.payer, CONSTANTS.MAX_NAME_LENGTH),
    note: bill.note
      ? sanitizeTextInput(bill.note, CONSTANTS.MAX_NOTE_LENGTH)
      : "",
    currency: bill.currency || "USD",
    splitType: bill.splitType || "equal",
    splitWith: Array.isArray(bill.splitWith)
      ? bill.splitWith.filter((person) => person && typeof person === "string")
      : [],
    splitAmounts:
      bill.splitAmounts && typeof bill.splitAmounts === "object"
        ? bill.splitAmounts
        : {},
    photoUri:
      bill.photoUri && typeof bill.photoUri === "string" ? bill.photoUri : null,
    createdAt: bill.createdAt,
    date: bill.date || bill.createdAt,
  };
};

const validateFriendData = (friend) => {
  return (
    friend &&
    typeof friend === "object" &&
    friend.name &&
    typeof friend.name === "string" &&
    friend.name.trim().length > 0
  );
};

const sanitizeFriendsArray = (friends) => {
  if (!Array.isArray(friends)) return [];

  return friends.filter(validateFriendData).map((friend) => ({
    ...friend,
    name: sanitizeTextInput(friend.name, CONSTANTS.MAX_NAME_LENGTH),
    emoji: friend.emoji || "👤",
  }));
};

// Enhanced friends dropdown options with emojis for History screen
const getEnhancedFriendsDropdownOptions = (friends, you, profileEmoji) => {
  // Validate inputs to prevent invalid dropdown options
  if (!you || typeof you !== "string") return [];
  const userEmoji = profileEmoji || "👤";
  if (!friends || !Array.isArray(friends))
    return [{ label: `${userEmoji} ${you}`, value: you }];

  // Cache friend options to avoid repeated computations
  const friendOptions = friends.map((friend) => ({
    label: `${friend.emoji || "👤"} ${friend.name}`,
    value: friend.name,
  }));

  return [{ label: `${userEmoji} ${you}`, value: you }, ...friendOptions];
};

// Currency options with flag emojis for History screen
const localCurrencyOptions = [
  { label: "🇺🇸 USD", value: "USD" },
  { label: "🇨🇦 CAD", value: "CAD" },
  { label: "🇮🇳 INR", value: "INR" },
  { label: "🇲🇽 MXN", value: "MXN" },
];

// Split type options for History screen
const splitTypeOptions = [
  { label: "➗ Equal split", value: "equal" },
  { label: "💰 Custom split", value: "custom" },
];

// Image Viewer Modal Component
const ImageViewerModal = ({
  visible,
  imageUri,
  onClose,
  onUploadImage,
  darkMode,
}) => {
  if (!imageUri) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.imageViewerContainer}>
              <View style={styles.imageViewerHeader}>
                <Text
                  style={[styles.imageViewerTitle, darkMode && styles.darkText]}
                >
                  Receipt Photo
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.imageViewerCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={
                      darkMode
                        ? Colors.text.primary.dark
                        : Colors.text.primary.light
                    }
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.noImageContainer}>
                <View
                  style={[
                    styles.noImageIcon,
                    darkMode && styles.darkNoImageIcon,
                  ]}
                >
                  <Ionicons
                    name="camera"
                    size={48}
                    color={
                      darkMode
                        ? "rgba(255, 255, 255, 0.6)"
                        : "rgba(0, 0, 0, 0.3)"
                    }
                  />
                </View>
                <Text style={styles.noImageTitle}>No Photo Yet</Text>
                <Text style={styles.noImageSubtitle}>
                  Add a photo of your receipt to keep track of your expenses
                </Text>
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    darkMode && styles.darkUploadButton,
                  ]}
                  onPress={onUploadImage}
                >
                  <Ionicons
                    name="camera"
                    size={20}
                    color={darkMode ? "#fff" : "#fff"}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.uploadButtonText}>Add Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.imageViewerOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.imageViewerContainer}>
            <View style={styles.imageViewerHeader}>
              <Text
                style={[styles.imageViewerTitle, darkMode && styles.darkText]}
              >
                Receipt Photo
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.imageViewerCloseButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={
                    darkMode
                      ? Colors.text.primary.dark
                      : Colors.text.primary.light
                  }
                />
              </TouchableOpacity>
            </View>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

// PropTypes for ImageViewerModal component
ImageViewerModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  imageUri: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onUploadImage: PropTypes.func.isRequired,
  darkMode: PropTypes.bool,
};

ImageViewerModal.defaultProps = {
  imageUri: null,
  darkMode: false,
};

// Optimized Bill Item Component with memoized functions
const BillItem = React.memo(
  ({
    item,
    onEdit,
    onDelete,
    onDuplicate,
    onImagePress,
    you,
    darkMode,
    isDuplicating,
    isDeleting,
    // isUploadingImage, // Currently unused
  }) => {
    // Memoize expensive formatting functions
    const formatDate = useMemo(() => {
      if (!item?.createdAt && !item?.date) return "Invalid Date";
      const dateString = item.date || item.createdAt;
      if (!dateString) return "Invalid Date";
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }, [item?.createdAt, item?.date]);

    const formatAmount = useMemo(() => {
      if (!item?.amount) return "$0.00";
      const symbol = getCurrencySymbol(item.currency || "USD");
      const parsed = parseFloat(item.amount);
      const numAmount = Number.isNaN(parsed) ? 0 : parsed;
      return `${symbol}${numAmount.toFixed(2)}`;
    }, [item?.amount, item?.currency]);

    const getSplitText = useMemo(() => {
      if (
        !item?.splitWith ||
        !Array.isArray(item.splitWith) ||
        item.splitWith.length === 0
      )
        return "No split";
      // Filter out null/undefined values and validate
      const validSplitWith = item.splitWith.filter(
        (person) => person && typeof person === "string"
      );
      if (validSplitWith.length === 0) return "No split";
      if (validSplitWith.length === 1) return `Split with ${validSplitWith[0]}`;
      if (validSplitWith.length === 2)
        return `Split with ${validSplitWith.join(" & ")}`;
      return `Split with ${validSplitWith.length} people`;
    }, [item?.splitWith]);

    const getSplitTypeText = useMemo(() => {
      if (item?.splitType === "custom") return "💰 Custom split";
      return "⚖️ Equal split";
    }, [item?.splitType]);

    return (
      <View style={[styles.billItem, darkMode && styles.darkBillItem]}>
        <View style={styles.billHeader}>
          <View style={styles.billMainInfo}>
            <Text
              style={[styles.billName, darkMode && styles.darkText]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text style={[styles.billAmount, darkMode && styles.darkAmount]}>
              {formatAmount}
            </Text>
          </View>
          <View style={styles.billDateContainer}>
            <Text style={[styles.billDate, darkMode && styles.darkSubtext]}>
              {formatDate}
            </Text>
            {item.photoUri && (
              <TouchableOpacity
                style={styles.photoPreview}
                onPress={() => onImagePress(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="View expense photo"
                accessibilityHint="Tap to view or edit the attached photo"
              >
                <Image
                  source={{ uri: item.photoUri }}
                  style={styles.photoPreviewImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            {!item.photoUri && (
              <TouchableOpacity
                style={[
                  styles.photoIndicator,
                  styles.noPhotoIndicator,
                  darkMode && styles.darkNoPhotoIndicator,
                ]}
                onPress={() => onImagePress(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="camera-outline"
                  size={16}
                  color={
                    darkMode
                      ? Colors.text.secondary.dark
                      : Colors.text.secondary.light
                  }
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.billDetails}>
          <View style={styles.billDetailRow}>
            <Ionicons
              name="person"
              size={14}
              color={darkMode ? "#A0AEC0" : "#6B7280"}
            />
            <Text
              style={[styles.billDetailText, darkMode && styles.darkSubtext]}
            >
              Paid by {item.payer}
            </Text>
          </View>

          <View style={styles.billDetailRow}>
            <Ionicons
              name="people"
              size={14}
              color={darkMode ? "#A0AEC0" : "#6B7280"}
            />
            <Text
              style={[styles.billDetailText, darkMode && styles.darkSubtext]}
            >
              {getSplitText}
            </Text>
          </View>

          <View style={styles.billDetailRow}>
            <Text
              style={[
                styles.splitTypeIndicator,
                darkMode && styles.darkSubtext,
              ]}
            >
              {getSplitTypeText}
            </Text>
          </View>

          {item.note && (
            <View style={styles.billDetailRow}>
              <Ionicons
                name="document-text"
                size={14}
                color={
                  darkMode
                    ? Colors.text.secondary.dark
                    : Colors.text.secondary.light
                }
              />
              <Text
                style={[styles.billNote, darkMode && styles.darkSubtext]}
                numberOfLines={2}
              >
                {item.note}
              </Text>
            </View>
          )}
        </View>

        {/* Only show action buttons if current user is the payer */}
        {item.payer === you && (
          <View style={styles.billActions}>
            <Pressable
              onPress={() => onDuplicate(item)}
              disabled={isDuplicating === item.id}
              style={({ pressed }) => [
                styles.actionButton,
                styles.duplicateButton,
                darkMode && styles.darkDuplicateButton,
                pressed && styles.actionButtonPressed,
                isDuplicating === item.id && {
                  opacity: CONSTANTS.OPACITY_DISABLED,
                },
              ]}
            >
              {isDuplicating === item.id ? (
                <ActivityIndicator
                  size="small"
                  color={darkMode ? "#81C784" : "#388E3C"}
                />
              ) : (
                <Text
                  style={[
                    styles.duplicateButtonText,
                    darkMode && styles.darkDuplicateButtonText,
                  ]}
                >
                  Duplicate
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => onEdit(item)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.editButton,
                darkMode && styles.darkEditButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.editButtonText,
                  darkMode && styles.darkEditButtonText,
                ]}
              >
                Edit
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onDelete(item)}
              disabled={isDeleting === item.id}
              style={({ pressed }) => [
                styles.actionButton,
                styles.deleteButton,
                darkMode && styles.darkDeleteButton,
                pressed && styles.actionButtonPressed,
                isDeleting === item.id && {
                  opacity: CONSTANTS.OPACITY_DISABLED,
                },
              ]}
            >
              {isDeleting === item.id ? (
                <ActivityIndicator
                  size="small"
                  color={darkMode ? "#FF8A80" : "#D32F2F"}
                />
              ) : (
                <Text
                  style={[
                    styles.deleteButtonText,
                    darkMode && styles.darkDeleteButtonText,
                  ]}
                >
                  Delete
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    );
  }
);

// PropTypes for BillItem component
BillItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    currency: PropTypes.string,
    createdAt: PropTypes.string,
    date: PropTypes.string,
    payer: PropTypes.string,
    splitWith: PropTypes.arrayOf(PropTypes.string),
    splitType: PropTypes.string,
    note: PropTypes.string,
    photoUri: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onImagePress: PropTypes.func.isRequired,
  you: PropTypes.string.isRequired,
  darkMode: PropTypes.bool,
  isDuplicating: PropTypes.string,
  isDeleting: PropTypes.string,
  // isUploadingImage: PropTypes.string, // Currently unused
};

BillItem.defaultProps = {
  darkMode: false,
  isDuplicating: null,
  isDeleting: null,
  // isUploadingImage: null, // Currently unused
};

// Enhanced Edit Modal Component
const EditBillModal = ({
  visible,
  editBillData,
  setEditBillData,
  payer,
  setPayer,
  splitWith,
  setSplitWith,
  note,
  setNote,
  currency,
  setCurrency,
  expenseDate,
  setExpenseDate,
  payerDropdownOpen,
  setPayerDropdownOpen,
  splitDropdownOpen,
  setSplitDropdownOpen,
  currencyDropdownOpen,
  setCurrencyDropdownOpen,
  splitType,
  setSplitType,
  customSplitAmounts,
  setCustomSplitAmounts,
  splitTypeDropdownOpen,
  setSplitTypeDropdownOpen,
  showDatePicker,
  setShowDatePicker,
  fullFriendsList,
  you,
  onSave,
  onCancel,
  isLoading,
  darkMode,
}) => {
  const [errors, setErrors] = useState({});

  // Track previous split type to manage custom splits properly
  const prevSplitTypeRef = useRef(splitType);

  // Clear custom splits when split type changes
  React.useEffect(() => {
    const prevSplitType = prevSplitTypeRef.current;

    // Only clear if split type actually changed (not on initial load)
    if (prevSplitType !== splitType) {
      if (splitType === "equal") {
        // Clear all custom splits when switching to equal
        setCustomSplitAmounts({});
      } else if (splitType === "custom" && prevSplitType === "equal") {
        // Auto-populate equal amounts when switching to custom
        if (splitWith.length > 0 && editBillData?.amount) {
          const equalAmount = (
            parseFloat(editBillData.amount) / splitWith.length
          ).toFixed(2);
          const newCustomAmounts = {};
          splitWith.forEach((member) => {
            newCustomAmounts[member] = equalAmount;
          });
          setCustomSplitAmounts(newCustomAmounts);
        }
      }
    }

    prevSplitTypeRef.current = splitType;
  }, [splitType, splitWith, editBillData?.amount]);

  const closeAllDropdowns = useCallback(() => {
    setPayerDropdownOpen(false);
    setSplitDropdownOpen(false);
    setCurrencyDropdownOpen(false);
    setSplitTypeDropdownOpen(false);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!editBillData?.name?.trim()) {
      newErrors.name = "Expense name is required";
    } else if (editBillData.name.trim().length < 2) {
      newErrors.name = "Expense name must be at least 2 characters";
    } else if (editBillData.name.trim().length > 50) {
      newErrors.name = "Expense name must be less than 50 characters";
    }

    const amount = parseFloat(editBillData?.amount);
    if (!editBillData?.amount?.trim()) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = "Amount must be a valid number greater than 0";
    } else if (amount > 999999) {
      newErrors.amount = "Amount cannot exceed 999,999";
    }

    // Date validation - cannot be more than 3 years in the past
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    if (expenseDate < threeYearsAgo) {
      newErrors.date = "Date cannot be more than 3 years in the past";
    }

    // Split with validation - user must select at least one other person besides themselves
    if (splitWith && splitWith.length > 0) {
      const othersSelected = splitWith.filter((person) => person !== you);
      if (othersSelected.length === 0) {
        newErrors.splitWith =
          "Please select at least one other person to split with";
      }
    } else {
      newErrors.splitWith = "Please select at least one person to split with";
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

    // Note validation
    if (note && note.trim()) {
      const noteValidation = validateNoteWordCount(note);
      if (!noteValidation.isValid) {
        newErrors.note = noteValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    closeAllDropdowns();
    if (validateForm()) {
      onSave();
    }
  };

  const handleDateChange = (event, selectedDate) => {
    // For Android, close the picker after selection
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        setExpenseDate(selectedDate);
        // Clear date error if valid date is selected
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
        if (errors.date && selectedDate >= threeYearsAgo) {
          setErrors((prev) => ({ ...prev, date: null }));
        }
      }
    } else {
      // For iOS, keep the picker open and update the date
      if (selectedDate) {
        setExpenseDate(selectedDate);
        // Clear date error if valid date is selected
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
        if (errors.date && selectedDate >= threeYearsAgo) {
          setErrors((prev) => ({ ...prev, date: null }));
        }
      }
    }
  };

  const handleDateDone = () => {
    setShowDatePicker(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        closeAllDropdowns();
        onCancel();
      }}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.modalContent}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[styles.modalHeader, darkMode && styles.darkModalContent]}
          >
            <Text
              style={[styles.modalTitle, darkMode && styles.darkModalTitle]}
            >
              Edit Expense
            </Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons
                name="close"
                size={24}
                color={
                  darkMode
                    ? Colors.text.primary.dark
                    : Colors.text.primary.light
                }
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={[
              styles.modalScrollContainer,
              darkMode && styles.darkModalContent,
            ]}
            contentContainerStyle={{
              padding: 20,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {/* Expense Name */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, darkMode && styles.darkInputLabel]}
              >
                Expense Name *
              </Text>
              <TextInput
                placeholder="Enter expense name"
                placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                value={editBillData?.name || ""}
                maxLength={CONSTANTS.MAX_NAME_LENGTH}
                autoCapitalize="words"
                autoCorrect={false}
                spellCheck={false}
                onChangeText={(txt) => {
                  // Security: Sanitize input to prevent XSS and malicious content
                  const sanitizedTxt = txt
                    .replace(/[<>"'&]/g, "") // Remove potentially dangerous characters
                    .replace(/\s+/g, " ") // Replace multiple spaces with single space
                    .substring(0, CONSTANTS.MAX_NAME_LENGTH); // Enforce max length

                  setEditBillData((prev) => ({ ...prev, name: sanitizedTxt }));
                  if (
                    errors.name &&
                    sanitizedTxt.trim().length >= CONSTANTS.MIN_NAME_LENGTH &&
                    sanitizedTxt.trim().length <= CONSTANTS.MAX_NAME_LENGTH
                  )
                    setErrors((prev) => ({ ...prev, name: null }));
                }}
                style={[
                  styles.textInput,
                  darkMode && styles.darkTextInput,
                  errors.name && styles.inputError,
                ]}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, darkMode && styles.darkInputLabel]}
              >
                Amount *
              </Text>
              <View style={styles.amountContainer}>
                <Text
                  style={[
                    styles.currencySymbol,
                    darkMode && styles.darkCurrencySymbol,
                  ]}
                >
                  {getCurrencySymbol(currency)}
                </Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                  keyboardType="numeric"
                  value={editBillData?.amount || ""}
                  onChangeText={(txt) => {
                    // Security: Strict validation and sanitization for amount input
                    if (typeof txt !== "string") return;

                    // Remove any non-numeric characters except decimal point
                    const cleanValue = txt.replace(/[^0-9.]/g, "");

                    // Prevent multiple decimal points
                    const parts = cleanValue.split(".");
                    const formattedValue =
                      parts.length > 2
                        ? parts[0] + "." + parts.slice(1).join("")
                        : cleanValue;

                    // Limit to reasonable length (max 10 chars including decimal)
                    const limitedValue = formattedValue.substring(0, 10);

                    // Prevent leading zeros (except for decimal values like 0.50)
                    const finalValue = limitedValue.replace(/^0+(?=\d)/, "");

                    setEditBillData((prev) => ({
                      ...prev,
                      amount: finalValue,
                    }));

                    // Enhanced validation
                    const amount = parseFloat(finalValue);
                    if (
                      errors.amount &&
                      finalValue.trim() &&
                      !isNaN(amount) &&
                      amount > 0 &&
                      amount <= 999999.99 && // More specific limit
                      /^\d+(\.\d{1,2})?$/.test(finalValue) // Regex for proper decimal format
                    ) {
                      setErrors((prev) => ({ ...prev, amount: null }));
                    }
                  }}
                  style={[
                    styles.textInput,
                    {
                      paddingLeft:
                        getCurrencySymbol(currency) === "Mex$"
                          ? 70
                          : getCurrencySymbol(currency) === "C$"
                          ? 45
                          : 33,
                    },
                    darkMode && styles.darkTextInput,
                    errors.amount && styles.inputError,
                  ]}
                />
              </View>
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>

            {/* Date Picker */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, darkMode && styles.darkInputLabel]}
              >
                Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.dateButton, darkMode && styles.darkDateButton]}
              >
                <Text style={styles.dateButtonIcon}>📅</Text>
                <Text
                  style={[
                    styles.dateButtonText,
                    darkMode && styles.darkDateButtonText,
                  ]}
                >
                  {expenseDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={expenseDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  marginLeft={-36}
                  themeVariant={darkMode ? "dark" : "light"}
                />
              )}
              {showDatePicker && Platform.OS === "ios" && (
                <TouchableOpacity
                  onPress={handleDateDone}
                  style={[
                    styles.dateDoneButton,
                    darkMode && styles.darkDateDoneButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateDoneButtonText,
                      darkMode && styles.darkDateDoneButtonText,
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              )}
              {errors.date && (
                <Text style={styles.errorText}>{errors.date}</Text>
              )}
            </View>

            {/* Currency */}
            <View style={[styles.inputGroup]}>
              <Text
                style={[styles.inputLabel, darkMode && styles.darkInputLabel]}
              >
                Currency
              </Text>
              <DropDownPicker
                placeholder="Select currency"
                open={currencyDropdownOpen}
                value={currency}
                items={localCurrencyOptions}
                setOpen={(open) => {
                  closeAllDropdowns();
                  setCurrencyDropdownOpen(open);
                }}
                setValue={setCurrency}
                setItems={() => {}}
                style={[styles.dropdown, darkMode && styles.darkDropdown]}
                zIndex={CONSTANTS.Z_INDEX_DROPDOWN_HIGH}
                maxHeight={200}
                dropDownContainerStyle={[
                  styles.dropdownContainer,
                  darkMode && styles.darkDropdownContainer,
                ]}
                textStyle={[
                  styles.dropdownText,
                  darkMode && styles.darkDropdownText,
                ]}
                placeholderStyle={[
                  styles.dropdownPlaceholder,
                  darkMode && styles.darkDropdownPlaceholder,
                ]}
                listMode="SCROLLVIEW"
                scrollViewProps={{
                  keyboardShouldPersistTaps: "handled",
                  nestedScrollEnabled: true,
                  showsVerticalScrollIndicator: true,
                }}
                arrowIconStyle={{
                  tintColor: darkMode ? "#D69E2E" : "#8B4513",
                }}
                tickIconStyle={{
                  tintColor: darkMode ? "#D69E2E" : "#8B4513",
                }}
              />
            </View>

            {/* Who Paid */}
            <View style={[styles.inputGroup]}>
              <Text
                style={[styles.inputLabel, darkMode && styles.darkInputLabel]}
              >
                Who paid? *
              </Text>
              <DropDownPicker
                placeholder="Select who paid"
                open={payerDropdownOpen}
                value={payer}
                items={fullFriendsList}
                setOpen={(open) => {
                  closeAllDropdowns();
                  setPayerDropdownOpen(open);
                }}
                setValue={setPayer}
                setItems={() => {}}
                style={[
                  styles.dropdown,
                  darkMode && styles.darkDropdown,
                  errors.payer && styles.inputError,
                ]}
                dropDownContainerStyle={[
                  styles.dropdownContainer,
                  darkMode && styles.darkDropdownContainer,
                ]}
                textStyle={[
                  styles.dropdownText,
                  darkMode && styles.darkDropdownText,
                ]}
                placeholderStyle={[
                  styles.dropdownPlaceholder,
                  darkMode && styles.darkDropdownPlaceholder,
                ]}
                searchable
                searchPlaceholder="Search..."
                searchTextInputStyle={[
                  styles.searchTextInput,
                  darkMode && styles.darkSearchTextInput,
                ]}
                listMode="SCROLLVIEW"
                scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
                arrowIconStyle={{
                  tintColor: darkMode ? "#D69E2E" : "#8B4513",
                }}
                tickIconStyle={{
                  tintColor: darkMode ? "#D69E2E" : "#8B4513",
                }}
                zIndex={CONSTANTS.Z_INDEX_DROPDOWN_MEDIUM}
              />
              {errors.payer && (
                <Text style={styles.errorText}>{errors.payer}</Text>
              )}
            </View>

            {/* Split With */}
            <View style={[styles.inputGroup]}>
              <Text
                style={[styles.inputLabel, darkMode && styles.darkInputLabel]}
              >
                Split with who? *
              </Text>
              <DropDownPicker
                multiple
                min={0}
                placeholder="Select people to split with"
                open={splitDropdownOpen}
                value={splitWith}
                items={fullFriendsList}
                setOpen={(open) => {
                  closeAllDropdowns();
                  setSplitDropdownOpen(open);
                }}
                setValue={(value) => {
                  setSplitWith(value);
                  if (
                    errors.splitWith &&
                    value &&
                    Array.isArray(value) &&
                    value.length > 0
                  ) {
                    const othersSelected = value.filter(
                      (person) => person !== you
                    );
                    if (othersSelected.length > 0)
                      setErrors((prev) => ({ ...prev, splitWith: null }));
                  }
                }}
                setItems={() => {}}
                style={[
                  styles.dropdown,
                  darkMode && styles.darkDropdown,
                  errors.splitWith && styles.inputError,
                ]}
                dropDownContainerStyle={[
                  styles.dropdownContainer,
                  darkMode && styles.darkDropdownContainer,
                ]}
                textStyle={[
                  styles.dropdownText,
                  darkMode && styles.darkDropdownText,
                ]}
                placeholderStyle={[
                  styles.dropdownPlaceholder,
                  darkMode && styles.darkDropdownPlaceholder,
                ]}
                mode="BADGE"
                searchable
                searchPlaceholder="Search..."
                searchTextInputStyle={[
                  styles.searchTextInput,
                  darkMode && styles.darkSearchTextInput,
                ]}
                listMode="SCROLLVIEW"
                scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
                arrowIconStyle={{
                  tintColor: darkMode ? "#D69E2E" : "#8B4513",
                }}
                tickIconStyle={{
                  tintColor: darkMode ? "#D69E2E" : "#8B4513",
                }}
                zIndex={CONSTANTS.Z_INDEX_DROPDOWN_LOW}
                badgeColors={[
                  "#F2C4DE",
                  "#C4F2D2",
                  "#C4D7F2",
                  "#F2EBC4",
                  "#E1C4F2",
                ]}
                badgeDotColors={[
                  "#E63946",
                  "#2A9D8F",
                  "#264653",
                  "#E9C46A",
                  "#A857D4",
                ]}
                badgeTextStyle={[
                  styles.badgeTextStyle,
                  darkMode && styles.darkBadgeTextStyle,
                ]}
              />
              {errors.splitWith && (
                <Text style={styles.errorText}>{errors.splitWith}</Text>
              )}
            </View>

            {/* How to Split */}
            <View style={[styles.inputGroup]}>
              <Text
                style={[styles.inputLabel, darkMode && styles.darkInputLabel]}
              >
                How to split?
              </Text>
              <DropDownPicker
                placeholder="Select split type"
                open={splitTypeDropdownOpen}
                value={splitType}
                items={splitTypeOptions}
                setOpen={(open) => {
                  closeAllDropdowns();
                  setSplitTypeDropdownOpen(open);
                }}
                setValue={setSplitType}
                setItems={() => {}}
                style={[styles.dropdown, darkMode && styles.darkDropdown]}
                maxHeight={200}
                dropDownContainerStyle={[
                  styles.dropdownContainer,
                  darkMode && styles.darkDropdownContainer,
                ]}
                textStyle={[
                  styles.dropdownText,
                  darkMode && styles.darkDropdownText,
                ]}
                placeholderStyle={[
                  styles.dropdownPlaceholder,
                  darkMode && styles.darkDropdownPlaceholder,
                ]}
                listMode="SCROLLVIEW"
                scrollViewProps={{
                  keyboardShouldPersistTaps: "handled",
                  nestedScrollEnabled: true,
                  showsVerticalScrollIndicator: true,
                }}
                arrowIconStyle={{
                  tintColor: darkMode ? "#D69E2E" : "#8B4513",
                }}
                tickIconStyle={{
                  tintColor: darkMode ? "#D69E2E" : "#8B4513",
                }}
                zIndex={CONSTANTS.Z_INDEX_DROPDOWN_LOWEST}
              />
            </View>

            {/* Custom Split Amounts - Only show when split type is custom */}
            {splitType === "custom" && (
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.inputLabel, darkMode && styles.darkInputLabel]}
                >
                  Enter amount for each person ({getCurrencySymbol(currency)})
                </Text>
                {Array.from(new Set([payer, ...splitWith]))
                  .filter(Boolean)
                  .map((participant) => (
                    <View key={participant} style={styles.customSplitRow}>
                      <Text
                        style={[
                          styles.participantName,
                          darkMode && styles.darkParticipantName,
                        ]}
                      >
                        {participant === you
                          ? `${youWithEmoji} (You)`
                          : participant}
                      </Text>
                      <View style={styles.customSplitInputContainer}>
                        <Text
                          style={[
                            styles.customSplitPrefix,
                            darkMode && { color: "#D69E2E" },
                          ]}
                        >
                          {getCurrencySymbol(currency)}
                        </Text>
                        <TextInput
                          placeholder="0.00"
                          placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                          keyboardType="numeric"
                          value={
                            customSplitAmounts[participant]?.toString() || ""
                          }
                          onChangeText={(value) => {
                            // Security: Enhanced validation for custom split amounts
                            if (typeof value !== "string") return;

                            // For custom amounts: allow numbers and one decimal point
                            let cleanValue = value.replace(/[^0-9.]/g, "");
                            const parts = cleanValue.split(".");
                            cleanValue =
                              parts.length > 2
                                ? parts[0] + "." + parts.slice(1).join("")
                                : cleanValue;
                            // Limit to reasonable amount
                            cleanValue = cleanValue.substring(
                              0,
                              CONSTANTS.MAX_CUSTOM_SPLIT_LENGTH
                            );

                            setCustomSplitAmounts((prev) => ({
                              ...prev,
                              [participant]: cleanValue,
                            }));

                            // Clear custom splits error when user starts typing
                            if (errors.customSplitAmounts && cleanValue)
                              setErrors((prev) => ({
                                ...prev,
                                customSplitAmounts: null,
                              }));
                          }}
                          style={[
                            styles.customSplitInput,
                            darkMode && styles.darkCustomSplitInput,
                          ]}
                        />
                      </View>
                    </View>
                  ))}

                {/* Show total validation */}
                {splitType === "custom" && (
                  <View
                    style={[
                      styles.totalValidation,
                      darkMode && styles.darkTotalValidation,
                    ]}
                  >
                    <Text
                      style={[
                        styles.totalText,
                        darkMode && styles.darkTotalText,
                      ]}
                    >
                      Total: {getCurrencySymbol(currency)}
                      {Object.values(customSplitAmounts)
                        .reduce((total, amount) => {
                          return total + (parseFloat(amount) || 0);
                        }, 0)
                        .toFixed(2)}{" "}
                      / {getCurrencySymbol(currency)}
                      {editBillData?.amount || "0.00"}
                    </Text>
                    <Text
                      style={[
                        styles.expectedText,
                        darkMode && styles.darkExpectedText,
                      ]}
                    >
                      Expected: {getCurrencySymbol(currency)}
                      {parseFloat(editBillData?.amount || 0).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Show validation error */}
                {errors.customSplitAmounts && (
                  <Text style={styles.errorText}>
                    {errors.customSplitAmounts}
                  </Text>
                )}
              </View>
            )}

            {/* Note */}
            <View style={[styles.inputGroup, { marginBottom: 16 }]}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={[styles.inputLabel, darkMode && styles.darkInputLabel]}
                >
                  Note (optional)
                </Text>
                <Text
                  style={[
                    { fontSize: 12, color: darkMode ? "#A0AEC0" : "#999" },
                  ]}
                >
                  {getWordCount(note)}/100 words
                </Text>
              </View>
              <TextInput
                placeholder="Add a note..."
                placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                value={note}
                onChangeText={(txt) => {
                  // Security: Sanitize note input to prevent XSS
                  const sanitizedNote = txt
                    .replace(/[<>"'&]/g, "") // Remove potentially dangerous characters
                    .substring(0, CONSTANTS.MAX_NOTE_LENGTH); // Enforce max length for notes

                  setNote(sanitizedNote);

                  // Clear validation errors if note is valid
                  if (
                    errors.note &&
                    sanitizedNote.trim().length <= CONSTANTS.MAX_NOTE_LENGTH
                  ) {
                    setErrors((prev) => ({ ...prev, note: null }));
                  }
                }}
                style={[
                  styles.textInput,
                  styles.noteInput,
                  darkMode && styles.darkTextInput,
                  errors.note && styles.inputError,
                ]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
                autoCapitalize="sentences"
                autoCorrect={false}
                spellCheck={false}
              />
              {errors.note && (
                <Text style={styles.errorText}>{errors.note}</Text>
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          <View
            style={[styles.modalActions, darkMode && styles.darkModalActions]}
          >
            <TouchableOpacity
              onPress={onCancel}
              style={[
                styles.modalButton,
                styles.cancelButton,
                darkMode && styles.darkCancelButton,
              ]}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  darkMode && styles.darkCancelButtonText,
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.modalButton,
                styles.saveButton,
                darkMode && styles.darkSaveButton,
              ]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator
                  color={darkMode ? "#fff" : "#fff"}
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    darkMode && styles.darkSaveButtonText,
                  ]}
                >
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// PropTypes for EditBillModal component
EditBillModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  editBillData: PropTypes.object,
  setEditBillData: PropTypes.func.isRequired,
  payer: PropTypes.string,
  setPayer: PropTypes.func.isRequired,
  splitWith: PropTypes.arrayOf(PropTypes.string).isRequired,
  setSplitWith: PropTypes.func.isRequired,
  note: PropTypes.string.isRequired,
  setNote: PropTypes.func.isRequired,
  currency: PropTypes.string.isRequired,
  setCurrency: PropTypes.func.isRequired,
  splitType: PropTypes.string.isRequired,
  setSplitType: PropTypes.func.isRequired,
  customSplitAmounts: PropTypes.object.isRequired,
  setCustomSplitAmounts: PropTypes.func.isRequired,
  expenseDate: PropTypes.instanceOf(Date).isRequired,
  setExpenseDate: PropTypes.func.isRequired,
  fullFriendsList: PropTypes.arrayOf(PropTypes.object).isRequired,
  errors: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  payerDropdownOpen: PropTypes.bool.isRequired,
  setPayerDropdownOpen: PropTypes.func.isRequired,
  splitDropdownOpen: PropTypes.bool.isRequired,
  setSplitDropdownOpen: PropTypes.func.isRequired,
  currencyDropdownOpen: PropTypes.bool.isRequired,
  setCurrencyDropdownOpen: PropTypes.func.isRequired,
  splitTypeDropdownOpen: PropTypes.bool.isRequired,
  setSplitTypeDropdownOpen: PropTypes.func.isRequired,
  showDatePicker: PropTypes.bool.isRequired,
  setShowDatePicker: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  darkMode: PropTypes.bool,
  you: PropTypes.string.isRequired,
};

EditBillModal.defaultProps = {
  editBillData: null,
  payer: null,
  darkMode: false,
};

/**
 * HistoryScreen Component
 *
 * Manages expense history with comprehensive CRUD operations.
 * Features:
 * - Expense filtering and sorting
 * - Real-time search functionality
 * - Image management for receipts
 * - Advanced split calculations (equal, exact, percentage)
 * - Comprehensive form validation
 * - Loading states and error handling
 * - Dark mode support
 * - Accessibility features
 *
 * @param {Array} bills - Array of expense/bill objects
 * @param {Function} deleteBill - Function to delete a bill
 * @param {Function} editBill - Function to edit a bill
 * @param {Function} addBill - Function to add a new bill
 * @param {Array} friends - Array of friend objects
 * @param {string} profileName - Current user's profile name
 * @param {boolean} darkMode - Dark mode toggle state
 */
export default function HistoryScreen({
  bills,
  deleteBill,
  editBill,
  addBill,
  friends,
  profileName,
  profileEmoji,
  darkMode = false,
  // currentUser removed - not currently used
}) {
  // =====================================
  // HOOKS AND STATE MANAGEMENT
  // =====================================
  const insets = useSafeAreaInsets();
  const navigationSpacing = Math.max(insets.bottom, 20) + 10 + 60;

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBillData, setEditBillData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(null); // Track which bill is being duplicated
  const [isDeleting, setIsDeleting] = useState(null); // Track which bill is being deleted
  // Image upload state removed - not displayed in UI
  const [appLoading, setAppLoading] = useState(true); // Track app initialization
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [activeFilter, setActiveFilter] = useState("all");

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  // Bill details modal state
  const [billDetailsVisible, setBillDetailsVisible] = useState(false);
  const [selectedBillDetails, setSelectedBillDetails] = useState(null);

  // =====================================
  // EFFECTS AND INITIALIZATION
  // =====================================

  // Initialize app loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, CONSTANTS.ANIMATION_DURATION_SHORT); // Brief loading state for smooth initialization
    return () => clearTimeout(timer);
  }, []);

  // Development warning for data integrity
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const invalidBills = bills.filter((bill) => !validateBillData(bill));
      const invalidFriends = friends.filter(
        (friend) => !validateFriendData(friend)
      );
      
      if (invalidBills.length > 0) {
        console.warn(`Found ${invalidBills.length} invalid bills:`, invalidBills);
      }
      if (invalidFriends.length > 0) {
        console.warn(`Found ${invalidFriends.length} invalid friends:`, invalidFriends);
      }
    }
  }, [bills, friends]);

  // Form states for edit modal
  const [payer, setPayer] = useState(null);
  const [splitWith, setSplitWith] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [customSplitAmounts, setCustomSplitAmounts] = useState({});
  const [note, setNote] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [payerDropdownOpen, setPayerDropdownOpen] = useState(false);
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [splitTypeDropdownOpen, setSplitTypeDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // =====================================
  // DATA VALIDATION AND SANITIZATION
  // =====================================

  // Validate and sanitize incoming props
  const validatedBills = useMemo(() => {
    if (!Array.isArray(bills)) {
      return [];
    }
    return bills.map(sanitizeBillData).filter(Boolean);
  }, [bills]);

  const validatedFriends = useMemo(() => {
    return sanitizeFriendsArray(friends);
  }, [friends]);

  const you =
    profileName && profileName.trim()
      ? sanitizeTextInput(profileName.trim(), CONSTANTS.MAX_NAME_LENGTH)
      : "You";

  // Note: In multi-user environment, bills should use user IDs instead of display names
  // for proper data isolation and user identification
  const fullFriendsList = useMemo(
    () =>
      getEnhancedFriendsDropdownOptions(validatedFriends, you, profileEmoji),
    [validatedFriends, you, profileEmoji]
  );

  // =====================================
  // COMPUTED VALUES AND MEMOIZATION
  // =====================================

  // Enhanced filtering with date ranges and search - optimized with proper validation
  const filteredAndSortedBills = useMemo(() => {
    if (!validatedBills || validatedBills.length === 0) return [];

    let filtered = validatedBills.filter((bill) => {
      // Validate bill structure to prevent errors
      if (!bill || !bill.createdAt || !bill.name) return false;

      const billDate = new Date(bill.createdAt);
      // Check for invalid date
      if (isNaN(billDate.getTime())) return false;

      const now = new Date();

      // Date filter
      switch (activeFilter) {
        case "thisMonth":
          if (
            billDate.getMonth() !== now.getMonth() ||
            billDate.getFullYear() !== now.getFullYear()
          )
            return false;
          break;
        case "thisWeek":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          if (billDate < weekStart) return false;
          break;
      }

      // Text search - optimized with early returns
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const billName = bill.name?.toLowerCase() || "";
        const billPayer = bill.payer?.toLowerCase() || "";
        const billNote = bill.note?.toLowerCase() || "";
        const billAmount = bill.amount?.toString() || "";

        // Early return for performance
        if (
          billName.includes(query) ||
          billPayer.includes(query) ||
          billNote.includes(query) ||
          billAmount.includes(query)
        ) {
          return true;
        }

        // Check splitWith array
        if (bill.splitWith && Array.isArray(bill.splitWith)) {
          return bill.splitWith.some(
            (person) => person && person.toLowerCase().includes(query)
          );
        }

        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          const amountA = parseFloat(a.amount) || 0;
          const amountB = parseFloat(b.amount) || 0;
          return amountB - amountA;
        case "name":
          const nameA = a.name || "";
          const nameB = b.name || "";
          return nameA.localeCompare(nameB);
        case "date":
        default:
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          // Handle invalid dates
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          return dateB - dateA;
      }
    });
  }, [validatedBills, searchQuery, sortBy, activeFilter]);

  // =====================================
  // EVENT HANDLERS AND CALLBACKS
  // =====================================

  const handleRemovePhoto = useCallback(
    async (billItem) => {
      try {
        const updatedBill = {
          ...billItem,
          photoUri: null,
        };
        editBill(updatedBill);
        Alert.alert("Success!", "Photo removed successfully!");
      } catch (error) {
        Alert.alert("Error", "Failed to remove photo");
      }
    },
    [editBill]
  );

  const handleImagePress = useCallback(
    (item) => {
      if (item.photoUri) {
        // Photo exists - show options
        if (Platform.OS === "ios") {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: [
                "Cancel",
                "View Photo",
                "Replace Photo",
                "Remove Photo",
              ],
              cancelButtonIndex: 0,
              destructiveButtonIndex: 3,
            },
            (buttonIndex) => {
              if (buttonIndex === 1) {
                // View Photo
                setEditBillData(item);
                setSelectedImageUri(item.photoUri);
                setImageViewerVisible(true);
              } else if (buttonIndex === 2) {
                // Replace Photo
                handleImagePicker(item);
              } else if (buttonIndex === 3) {
                // Remove Photo
                handleRemovePhoto(item);
              }
            }
          );
        } else {
          Alert.alert("Photo Options", "What would you like to do?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "View Photo",
              onPress: () => {
                setEditBillData(item);
                setSelectedImageUri(item.photoUri);
                setImageViewerVisible(true);
              },
            },
            {
              text: "Replace Photo",
              onPress: () => handleImagePicker(item),
            },
            {
              text: "Remove Photo",
              style: "destructive",
              onPress: () => handleRemovePhoto(item),
            },
          ]);
        }
      } else {
        // No photo - direct to camera/gallery
        handleImagePicker(item);
      }
    },
    [handleRemovePhoto, handleImagePicker]
  );

  const handleImagePicker = useCallback(
    (billItem) => {
      closeAllDropdowns();
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["Cancel", "Take Photo", "Choose from Library"],
            cancelButtonIndex: 0,
          },
          (buttonIndex) => {
            if (buttonIndex === 1) {
              launchCamera(billItem);
            } else if (buttonIndex === 2) {
              pickImage(billItem);
            }
          }
        );
      } else {
        Alert.alert("Add Photo", "Choose an option:", [
          { text: "Cancel", style: "cancel" },
          { text: "Take Photo", onPress: () => launchCamera(billItem) },
          { text: "Choose from Library", onPress: () => pickImage(billItem) },
        ]);
      }
    },
    [closeAllDropdowns, launchCamera, pickImage]
  );

  const handleUploadImage = useCallback(() => {
    setImageViewerVisible(false);
    if (editBillData) {
      handleImagePicker(editBillData);
    }
  }, [editBillData, handleImagePicker]);

  const closeAllDropdowns = useCallback(() => {
    setPayerDropdownOpen(false);
    setSplitDropdownOpen(false);
    setCurrencyDropdownOpen(false);
    setSplitTypeDropdownOpen(false);
  }, []);

  // Permission handler for camera and library access
  // Removed - using new permission utility functions instead

  // Camera functions - improved from Profile screen approach
  const pickImage = useCallback(
    async (billItem) => {
      try {
        if (!billItem) {
          Alert.alert("Error", "No bill selected");
          return;
        }

        const hasPermission = await requestMediaLibraryPermissionWithEducation('update receipt photos');
        if (!hasPermission) return;
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
          const updatedBill = {
            ...billItem,
            photoUri: result.assets[0].uri,
          };
          await editBill(updatedBill);
          Alert.alert("Success!", "Photo updated successfully!");
        }
      } catch (error) {
        Alert.alert(
          "Error",
          `Unable to access photo library: ${error.message || "Please try again."}`
        );
      }
    },
    [editBill]
  );

  const launchCamera = useCallback(
    async (billItem) => {
      try {
        if (!billItem) {
          Alert.alert("Error", "No bill selected");
          return;
        }

        const hasPermission = await requestCameraPermissionWithEducation('take receipt photos');
        if (!hasPermission) return;

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.5,
          allowsMultipleSelection: false,
          exif: false,
          base64: false,
        });

        if (!result.canceled && result.assets?.length > 0) {
          const updatedBill = {
            ...billItem,
            photoUri: result.assets[0].uri,
          };
          await editBill(updatedBill);
          Alert.alert("Success!", "Photo updated successfully!");
        }
      } catch (error) {
        console.error("Camera error:", error);
        Alert.alert("Error", "Unable to launch camera. Please try again.");
      }
    },
    [editBill]
  );

  // Bill details functionality
  const calculateBillSplit = useCallback((bill) => {
    const amount = parseFloat(bill.amount || 0);
    const splitGroup = bill.splitWith || [];
    const payer = bill.payer || "Unknown";
    const splitType = bill.splitType || "equal";
    const splitAmounts = bill.splitAmounts || {};

    let splitDetails = [];

    if (splitType === "custom" && splitAmounts) {
      // Custom amounts split
      splitDetails = splitGroup.map((person) => ({
        person,
        owes: splitAmounts[person] || 0,
        isPayer: person === payer,
      }));
    } else {
      // Equal split (default)
      const perPersonAmount =
        splitGroup.length > 0 ? amount / splitGroup.length : 0;
      splitDetails = splitGroup.map((person) => ({
        person,
        owes: perPersonAmount,
        isPayer: person === payer,
      }));
    }

    return splitDetails;
  }, []);

  const handleBillPress = useCallback((bill) => {
    setSelectedBillDetails(bill);
    setBillDetailsVisible(true);
  }, []);

  const closeBillDetails = useCallback(() => {
    setBillDetailsVisible(false);
    setSelectedBillDetails(null);
  }, []);

  const closeImageViewer = useCallback(() => {
    setImageViewerVisible(false);
    setSelectedImageUri(null);
  }, []);

  const openEditModal = useCallback((bill) => {
    setEditBillData(bill);

    // Ensure payer value matches dropdown options
    const payerValue = bill.payer || null;
    setPayer(payerValue);

    setSplitWith(bill.splitWith ? [...bill.splitWith] : []);
    setSplitType(bill.splitType || "equal");
    setCustomSplitAmounts(bill.splitAmounts || {});
    setNote(bill.note || "");
    setCurrency(bill.currency || "USD");
    setExpenseDate(bill.date ? new Date(bill.date) : new Date());
    setEditModalVisible(true);
  }, []);

  const handleEditSave = useCallback(async () => {
    setIsLoading(true);
    try {
      // Security: Validate all inputs before saving
      const sanitizedName = sanitizeTextInput(
        editBillData?.name || "",
        CONSTANTS.MAX_NAME_LENGTH
      );
      const sanitizedNote = sanitizeTextInput(
        note || "",
        CONSTANTS.MAX_NOTE_LENGTH
      );
      const sanitizedAmount = sanitizeNumericInput(
        editBillData?.amount || "",
        CONSTANTS.MAX_AMOUNT_LENGTH
      );

      // Validate required fields using utility functions
      if (!validateExpenseName(sanitizedName)) {
        throw new Error(
          `Expense name must be at least ${CONSTANTS.MIN_NAME_LENGTH} characters long`
        );
      }

      if (!validateAmount(sanitizedAmount)) {
        throw new Error(
          `Please enter a valid amount between ${CONSTANTS.MIN_AMOUNT_VALUE} and ${CONSTANTS.MAX_AMOUNT_VALUE}`
        );
      }

      if (!validatePayer(payer)) {
        throw new Error("Please select a valid payer");
      }

      let splitGroup = splitWith.includes(payer)
        ? splitWith
        : [payer, ...splitWith];

      // Validate split group
      splitGroup = splitGroup.filter(
        (person) => person && typeof person === "string"
      );
      if (!validateSplitGroup(splitGroup)) {
        throw new Error("At least one person must be selected for the split");
      }

      // Calculate split amounts based on split type with validation
      let splitAmounts = {};
      if (splitType === "equal") {
        // For equal split, don't store splitAmounts
        splitAmounts = {};
      } else if (splitType === "custom") {
        let total = 0;
        splitGroup.forEach((p) => {
          const amount = parseFloat(customSplitAmounts[p] || 0);
          if (!validateCustomSplitAmount(amount)) {
            throw new Error(
              `Invalid amount for ${p}. Must be between 0 and ${CONSTANTS.MAX_AMOUNT_VALUE}`
            );
          }
          splitAmounts[p] = amount;
          total += amount;
        });

        // Validate total matches bill amount
        if (Math.abs(total - parseFloat(sanitizedAmount)) > 0.01) {
          throw new Error(
            `Custom split total (${total.toFixed(
              2
            )}) must equal bill amount (${parseFloat(sanitizedAmount).toFixed(
              2
            )})`
          );
        }
      }

      const updatedBill = {
        ...editBillData,
        name: sanitizedName,
        amount: parseFloat(sanitizedAmount).toFixed(2),
        payer: payer,
        splitWith: splitGroup,
        splitType: splitType,
        splitAmounts: splitAmounts,
        note: sanitizedNote,
        currency: currency,
        date: expenseDate.toISOString(),
      };

      // Final validation of the complete bill object
      const sanitizedBill = sanitizeBillData(updatedBill);
      if (!sanitizedBill) {
        throw new Error(
          "Invalid bill data. Please check all fields and try again."
        );
      }

      await editBill(sanitizedBill);

      setEditModalVisible(false);
      setEditBillData(null);
      setPayer(null);
      setSplitWith([]);
      setSplitType("equal");
      setCustomSplitAmounts({});
      setNote("");
      setCurrency("USD");
      setExpenseDate(new Date());

      Alert.alert("Success! 🎉", "Expense updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update expense. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [
    editBillData,
    payer,
    splitWith,
    splitType,
    customSplitAmounts,
    note,
    currency,
    expenseDate,
    editBill,
  ]);

  const handleDelete = useCallback(
    (bill) => {
      Alert.alert(
        "Delete Expense",
        `Are you sure you want to delete "${bill.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                setIsDeleting(bill.id);
                await deleteBill(bill.id);
                Alert.alert("Deleted! 🗑️", "Expense deleted successfully!");
              } catch (error) {
                Alert.alert(
                  "Error",
                  "Failed to delete expense. Please try again."
                );
              } finally {
                setIsDeleting(null);
              }
            },
          },
        ]
      );
    },
    [deleteBill, setIsDeleting]
  );

  const handleDuplicate = useCallback(
    (bill) => {
      // Check if addBill function exists
      if (!addBill) {
        Alert.alert(
          "Error",
          "Duplicate function is not available. Please contact support."
        );
        return;
      }

      Alert.alert("Duplicate Expense", `Create a copy of "${bill.name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Duplicate",
          onPress: async () => {
            try {
              // Add haptic feedback for better UX
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsDuplicating(bill.id);

              // Validate bill data before duplication
              if (!bill.name || !bill.amount || !bill.payer) {
                Alert.alert("Error", "Cannot duplicate incomplete bill data");
                return;
              }

              // Simulate network delay for better UX
              await new Promise((resolve) =>
                setTimeout(resolve, CONSTANTS.ANIMATION_DURATION_LONG)
              );

              const duplicatedBill = {
                ...bill,
                id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
                name: `${bill.name} (Copy)`,
                createdAt: new Date().toISOString(),
                date: new Date().toISOString(),
                // Ensure all required fields are present
                payer: bill.payer || you,
                splitWith: bill.splitWith || [you],
                currency: bill.currency || "USD",
                amount: bill.amount || "0.00",
                splitType: bill.splitType || "equal",
                splitAmounts: bill.splitAmounts || {},
                note: bill.note || "",
                photoUri: bill.photoUri || null,
              };

              // Validate the duplicated bill data
              const sanitizedDuplicatedBill = sanitizeBillData(duplicatedBill);
              if (!sanitizedDuplicatedBill) {
                throw new Error(
                  "Unable to duplicate expense. Invalid data detected."
                );
              }

              await addBill(sanitizedDuplicatedBill);
              Alert.alert("Success! 📋", "Expense duplicated successfully!");
            } catch (error) {
              Alert.alert(
                "Duplication Failed",
                "Unable to create a copy of this expense. Please try again."
              );
            } finally {
              setIsDuplicating(null);
            }
          },
        },
      ]);
    },
    [addBill, you, setIsDuplicating]
  );

  const renderBillItem = useCallback(
    ({ item }) => (
      <Pressable
        onPress={() => handleBillPress(item)}
        style={({ pressed }) => [
          { opacity: pressed ? CONSTANTS.OPACITY_PRESSED : 1 },
        ]}
      >
        <BillItem
          item={item}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onImagePress={handleImagePress}
          you={you}
          darkMode={darkMode}
          isDuplicating={isDuplicating}
          isDeleting={isDeleting}
          // isUploadingImage={isUploadingImage} // Currently unused
        />
      </Pressable>
    ),
    [
      handleBillPress,
      openEditModal,
      handleDelete,
      handleDuplicate,
      handleImagePress,
      darkMode,
      isDuplicating,
    ]
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, darkMode && styles.darkEmptyIcon]}>
        <Ionicons
          name="receipt-outline"
          size={64}
          color={darkMode ? "#4A5568" : "#D1D5DB"}
        />
      </View>
      <Text style={[styles.emptyTitle, darkMode && styles.darkText]}>
        {searchQuery || activeFilter !== "all"
          ? "No expenses found"
          : "No expenses yet"}
      </Text>
      <Text style={[styles.emptySubtitle, darkMode && styles.darkSubtext]}>
        {searchQuery || activeFilter !== "all"
          ? "Try adjusting your search or filters"
          : "Start by adding your first expense!"}
      </Text>
      {(searchQuery || activeFilter !== "all") && (
        <TouchableOpacity
          onPress={() => {
            setSearchQuery("");
            setActiveFilter("all");
          }}
          style={[
            styles.clearFiltersButton,
            darkMode && styles.darkClearFiltersButton,
          ]}
        >
          <Text style={[styles.clearFiltersText, darkMode && styles.darkText]}>
            Clear Filters
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Removed getItemLayout for better performance with dynamic heights

  // Data integrity check - prevent rendering with invalid data
  if (!Array.isArray(bills)) {
    return (
      <SafeAreaView
        style={[styles.container, darkMode && styles.darkContainer]}
      >
        <StatusBar
          barStyle={darkMode ? "light-content" : "dark-content"}
          backgroundColor={darkMode ? "#1A202C" : "#EFE4D2"}
        />
        <View style={styles.loadingOverlay}>
          <Text
            style={[styles.loadingText, darkMode && styles.darkLoadingText]}
          >
            Error: Invalid data format. Please refresh the app.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!Array.isArray(friends)) {
    return (
      <SafeAreaView
        style={[styles.container, darkMode && styles.darkContainer]}
      >
        <StatusBar
          barStyle={darkMode ? "light-content" : "dark-content"}
          backgroundColor={darkMode ? "#1A202C" : "#EFE4D2"}
        />
        <View style={styles.loadingOverlay}>
          <Text
            style={[styles.loadingText, darkMode && styles.darkLoadingText]}
          >
            Error: Invalid friends data. Please refresh the app.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading overlay during app initialization
  if (appLoading) {
    return (
      <SafeAreaView
        style={[styles.container, darkMode && styles.darkContainer]}
      >
        <StatusBar
          barStyle={darkMode ? "light-content" : "dark-content"}
          backgroundColor={darkMode ? "#1A202C" : "#EFE4D2"}
        />
        <View style={styles.loadingOverlay}>
          <ActivityIndicator
            size="large"
            color={darkMode ? "#FF9500" : "#007AFF"}
          />
          <Text
            style={[styles.loadingText, darkMode && styles.darkLoadingText]}
          >
            Loading your expense history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={darkMode ? "#1A202C" : "#EFE4D2"}
      />

      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.darkTitleText]}>
          History Screen
        </Text>
        <Text style={[styles.subtitle, darkMode && styles.darkSubtext]}>
          Track and manage your expenses
        </Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.controlsContainer}>
        <View
          style={[
            styles.searchContainer,
            darkMode && styles.darkSearchContainer,
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={darkMode ? "#A0AEC0" : "#6B7280"}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search expenses..."
            placeholderTextColor={darkMode ? "#A0AEC0" : "#9CA3AF"}
            value={searchQuery}
            onChangeText={(txt) => {
              // Security: Sanitize search input to prevent injection attacks
              const sanitizedSearch = txt
                .replace(/[<>"'&]/g, "") // Remove potentially dangerous characters
                .replace(/[\r\n\t]/g, " ") // Replace newlines and tabs with spaces
                .substring(0, CONSTANTS.MAX_SEARCH_LENGTH); // Limit search query length

              setSearchQuery(sanitizedSearch);
            }}
            style={[styles.searchInput, darkMode && styles.darkSearchInput]}
            accessibilityLabel="Search expenses"
            accessibilityHint="Type to search through your expense history"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearSearchButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={darkMode ? "#A0AEC0" : "#9CA3AF"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {bills.length > 0 && (
        <View style={styles.filtersAndSortContainer}>
          <View style={styles.filtersContainer}>
            {["all", "thisMonth", "thisWeek"].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.activeFilterButton,
                  darkMode && styles.darkFilterButton,
                  activeFilter === filter &&
                    darkMode &&
                    styles.darkActiveFilterButton,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${
                  filter === "all"
                    ? "all expenses"
                    : filter === "thisMonth"
                    ? "this month"
                    : "this week"
                }`}
                accessibilityState={{ selected: activeFilter === filter }}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFilter === filter && styles.activeFilterButtonText,
                    darkMode &&
                      activeFilter !== filter &&
                      styles.darkFilterButtonText,
                    activeFilter === filter &&
                      darkMode &&
                      styles.darkActiveFilterButtonText,
                  ]}
                >
                  {filter === "all"
                    ? "All"
                    : filter === "thisMonth"
                    ? "This Month"
                    : "This Week"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => {
              const nextSort =
                sortBy === "date"
                  ? "amount"
                  : sortBy === "amount"
                  ? "name"
                  : "date";
              setSortBy(nextSort);
            }}
            style={[styles.sortButton, darkMode && styles.darkSortButton]}
          >
            <Ionicons
              name="swap-vertical"
              size={16}
              color={darkMode ? "#fff" : "#fff"} // White for both themes
            />
            <Text
              style={[
                styles.sortButtonText,
                darkMode && styles.darkSortButtonText,
              ]}
            >
              {sortBy === "date"
                ? "Date"
                : sortBy === "amount"
                ? "Amount"
                : "Name"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredAndSortedBills}
        keyExtractor={(item) => item.id}
        renderItem={renderBillItem}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: navigationSpacing },
          filteredAndSortedBills.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyComponent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={CONSTANTS.MAX_RENDER_BATCH}
        windowSize={CONSTANTS.WINDOW_SIZE}
        initialNumToRender={CONSTANTS.INITIAL_NUM_TO_RENDER}
        // getItemLayout removed for dynamic height support
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={imageViewerVisible}
        imageUri={selectedImageUri}
        onClose={closeImageViewer}
        onUploadImage={handleUploadImage}
        darkMode={darkMode}
      />

      {/* Bill Details Modal */}
      <Modal
        visible={billDetailsVisible}
        transparent
        animationType="slide"
        onRequestClose={closeBillDetails}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={[styles.modalHeader, darkMode && styles.darkModalContent]}
            >
              <Text
                style={[styles.modalTitle, darkMode && styles.darkModalTitle]}
              >
                Expense Details
              </Text>
              <TouchableOpacity onPress={closeBillDetails}>
                <Ionicons
                  name="close"
                  size={24}
                  color={
                    darkMode
                      ? Colors.text.primary.dark
                      : Colors.text.primary.light
                  }
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={[
                styles.modalScrollContainer,
                darkMode && styles.darkModalContent,
              ]}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {selectedBillDetails && (
                <>
                  {/* Bill Info */}
                  <View style={styles.billDetailsSection}>
                    <View
                      style={[
                        styles.billDetailsCard,
                        darkMode && styles.darkBillDetailsCard,
                      ]}
                    >
                      <Text
                        style={[
                          styles.billDetailsName,
                          darkMode && styles.darkBillDetailsName,
                        ]}
                      >
                        {selectedBillDetails.name}
                      </Text>
                      <Text
                        style={[
                          styles.billDetailsAmount,
                          darkMode && styles.darkBillDetailsAmount,
                        ]}
                      >
                        {getCurrencySymbol(
                          selectedBillDetails.currency || "USD"
                        )}
                        {parseFloat(selectedBillDetails.amount || 0).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.billDetailsDate,
                          darkMode && styles.darkSubtext,
                        ]}
                      >
                        {new Date(
                          selectedBillDetails.date ||
                            selectedBillDetails.createdAt
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Text>
                      {selectedBillDetails.note && (
                        <Text
                          style={[
                            styles.billDetailsNote,
                            darkMode && styles.darkSubtext,
                          ]}
                        >
                          Note: {selectedBillDetails.note}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Split Details */}
                  <View style={styles.billDetailsSection}>
                    <Text
                      style={[
                        styles.billDetailsSectionTitle,
                        darkMode && styles.darkBillDetailsSectionTitle,
                      ]}
                    >
                      Split Details
                    </Text>

                    <View
                      style={[
                        styles.payerCard,
                        darkMode && styles.darkPayerCard,
                      ]}
                    >
                      <View style={styles.payerHeader}>
                        <Ionicons name="person" size={20} color="#4CAF50" />
                        <Text
                          style={[
                            styles.payerLabel,
                            darkMode && styles.darkPayerLabel,
                          ]}
                        >
                          Paid by
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.payerName,
                          darkMode && styles.darkPayerName,
                        ]}
                      >
                        {selectedBillDetails.payer === you
                          ? `${selectedBillDetails.payer} (You)`
                          : selectedBillDetails.payer}
                      </Text>
                      <Text
                        style={[
                          styles.payerAmount,
                          darkMode && styles.darkPayerAmount,
                        ]}
                      >
                        {getCurrencySymbol(
                          selectedBillDetails.currency || "USD"
                        )}
                        {parseFloat(selectedBillDetails.amount || 0).toFixed(2)}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.splitMembersTitle,
                        darkMode && styles.darkBillDetailsSectionTitle,
                      ]}
                    >
                      Split Between (
                      {selectedBillDetails.splitWith?.length || 0} people)
                    </Text>

                    {calculateBillSplit(selectedBillDetails).map(
                      (split, index) => {
                        const owesToPayer = !split.isPayer && split.owes > 0;
                        return (
                          <View
                            key={index}
                            style={[
                              styles.splitMemberCard,
                              darkMode && styles.darkSplitMemberCard,
                              split.isPayer && styles.payerHighlight,
                              split.isPayer &&
                                darkMode &&
                                styles.darkPayerHighlight,
                            ]}
                          >
                            <View style={styles.splitMemberInfo}>
                              <View style={styles.splitMemberHeader}>
                                <Text
                                  style={[
                                    styles.splitMemberName,
                                    darkMode && styles.darkSplitMemberName,
                                  ]}
                                >
                                  {split.person === you
                                    ? `${split.person} (You)`
                                    : split.person}
                                </Text>
                                {split.isPayer && (
                                  <View style={styles.payerBadge}>
                                    <Text style={styles.payerBadgeText}>
                                      Payer
                                    </Text>
                                  </View>
                                )}
                              </View>

                              <View style={styles.splitAmountContainer}>
                                <Text
                                  style={[
                                    styles.splitAmount,
                                    darkMode && styles.darkSplitAmount,
                                  ]}
                                >
                                  {getCurrencySymbol(
                                    selectedBillDetails.currency || "USD"
                                  )}
                                  {split.owes.toFixed(2)}
                                </Text>
                                {selectedBillDetails.splitType ===
                                  "percentage" &&
                                  split.percentage && (
                                    <Text
                                      style={[
                                        styles.splitPercentage,
                                        darkMode && styles.darkSubtext,
                                      ]}
                                    >
                                      ({split.percentage}%)
                                    </Text>
                                  )}
                              </View>

                              {owesToPayer && (
                                <Text
                                  style={[
                                    styles.owesText,
                                    darkMode && styles.darkOwesText,
                                  ]}
                                >
                                  Owes{" "}
                                  {selectedBillDetails.payer === you
                                    ? "you"
                                    : selectedBillDetails.payer}
                                  :{" "}
                                  {getCurrencySymbol(
                                    selectedBillDetails.currency || "USD"
                                  )}
                                  {split.owes.toFixed(2)}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      }
                    )}
                  </View>

                  {/* Split Type Info */}
                  <View style={styles.billDetailsSection}>
                    <Text
                      style={[
                        styles.billDetailsSectionTitle,
                        darkMode && styles.darkBillDetailsSectionTitle,
                      ]}
                    >
                      Split Method
                    </Text>
                    <View
                      style={[
                        styles.splitTypeCard,
                        darkMode && styles.darkSplitTypeCard,
                      ]}
                    >
                      <Text
                        style={[
                          styles.splitTypeText,
                          darkMode && styles.darkSplitTypeText,
                        ]}
                      >
                        {selectedBillDetails.splitType === "custom"
                          ? "💰 Custom split"
                          : "⚖️ Equal split"}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <EditBillModal
        visible={editModalVisible}
        editBillData={editBillData}
        setEditBillData={setEditBillData}
        payer={payer}
        setPayer={setPayer}
        splitWith={splitWith}
        setSplitWith={setSplitWith}
        note={note}
        setNote={setNote}
        currency={currency}
        setCurrency={setCurrency}
        expenseDate={expenseDate}
        setExpenseDate={setExpenseDate}
        payerDropdownOpen={payerDropdownOpen}
        setPayerDropdownOpen={setPayerDropdownOpen}
        splitDropdownOpen={splitDropdownOpen}
        setSplitDropdownOpen={setSplitDropdownOpen}
        currencyDropdownOpen={currencyDropdownOpen}
        setCurrencyDropdownOpen={setCurrencyDropdownOpen}
        splitType={splitType}
        setSplitType={setSplitType}
        customSplitAmounts={customSplitAmounts}
        setCustomSplitAmounts={setCustomSplitAmounts}
        splitTypeDropdownOpen={splitTypeDropdownOpen}
        setSplitTypeDropdownOpen={setSplitTypeDropdownOpen}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        fullFriendsList={fullFriendsList}
        you={you}
        onSave={handleEditSave}
        onCancel={() => setEditModalVisible(false)}
        isLoading={isLoading}
        darkMode={darkMode}
      />
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

  // Loading overlay styles
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  darkLoadingText: {
    color: "#A0AEC0",
  },

  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
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
  darkText: {
    color: "#FFFFFF", // Pure white for maximum contrast
  },
  darkTitleText: {
    color: "#D69E2E", // Gold color for headers in dark mode
  },
  darkSubtext: {
    color: "#CBD5E0",
  },

  // Controls
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  darkSearchContainer: {
    backgroundColor: "#2D3748",
    borderColor: "#4A5568",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#374151",
  },
  darkSearchInput: {
    color: "#FFFFFF",
  },
  clearSearchButton: {
    padding: 4,
  },

  // Filters and Sort Container
  filtersAndSortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  filtersContainer: {
    flexDirection: "row",
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  darkFilterButton: {
    backgroundColor: "#2D3748",
    borderColor: "#4A5568",
  },
  activeFilterButton: {
    backgroundColor: "#8B4513", // Brown theme
    borderColor: "#8B4513",
  },
  darkActiveFilterButton: {
    backgroundColor: "#D69E2E", // Gold for dark mode
    borderColor: "#D69E2E",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  darkFilterButtonText: {
    color: "#E2E8F0",
  },
  activeFilterButtonText: {
    color: "#fff",
  },
  darkActiveFilterButtonText: {
    color: "#fff",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B4513", // Brown theme to match active filters
    paddingHorizontal: 12,
    paddingVertical: 6, // Match filter button padding
    borderRadius: 16, // Match filter button border radius
    borderWidth: 1,
    borderColor: "#8B4513",
    gap: 4,
  },
  darkSortButton: {
    backgroundColor: "#D69E2E", // Gold for dark mode
    borderColor: "#D69E2E",
  },
  sortButtonText: {
    fontSize: 12, // Match filter button font size
    fontWeight: "500",
    color: "#fff", // White text for brown background
  },
  darkSortButtonText: {
    color: "#fff", // White text for gold background
  },

  // List
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  itemSeparator: {
    height: 8,
  },

  // Bill Item
  billItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkBillItem: {
    backgroundColor: "#2D3748",
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  billMainInfo: {
    flex: 1,
    marginRight: 16,
  },
  billName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B4513", // Brown theme
  },
  darkAmount: {
    color: "#D69E2E", // Gold for dark mode
  },
  billDateContainer: {
    alignItems: "flex-end",
  },
  billDate: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "right",
  },
  photoIndicator: {
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noPhotoIndicator: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FED7D7",
    borderStyle: "dashed",
  },
  darkNoPhotoIndicator: {
    backgroundColor: "#2D3748",
    borderColor: "#4A5568",
  },
  photoPreview: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoPreviewImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  billDetails: {
    marginBottom: 8,
  },
  billDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  billDetailText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  splitTypeIndicator: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  billNote: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    flex: 1,
  },

  // Action Buttons
  billActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  duplicateButton: {
    backgroundColor: "#F1F8E9",
    borderColor: "#C8E6C9",
  },
  darkDuplicateButton: {
    backgroundColor: "#2D4A34",
    borderColor: "#4CAF50",
  },
  duplicateButtonText: {
    fontSize: 13,
    color: "#388E3C",
    fontWeight: "500",
  },
  darkDuplicateButtonText: {
    color: "#81C784",
  },
  editButton: {
    backgroundColor: "#F8F4E8", // Light brown background
    borderColor: "#D4A574",
  },
  darkEditButton: {
    backgroundColor: "#3D3D3D",
    borderColor: "#D69E2E",
  },
  editButtonText: {
    fontSize: 13,
    color: "#8B4513", // Brown theme
    fontWeight: "500",
  },
  darkEditButtonText: {
    color: "#D69E2E",
  },
  deleteButton: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFCDD2",
  },
  darkDeleteButton: {
    backgroundColor: "#4A2D32",
    borderColor: "#F44336",
  },
  deleteButtonText: {
    fontSize: 13,
    color: "#D32F2F",
    fontWeight: "500",
  },
  darkDeleteButtonText: {
    color: "#EF5350",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  darkEmptyIcon: {
    backgroundColor: "#2D3748",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: "#8B4513", // Brown theme
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  darkClearFiltersButton: {
    backgroundColor: "#D69E2E", // Gold for dark mode
  },
  clearFiltersText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },

  // Image Viewer Modal
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerContainer: {
    flex: 1,
    width: "100%",
    padding: 20,
  },
  imageViewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  imageViewerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  imageViewerCloseButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },

  // No Image Upload State
  noImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  noImageIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  darkNoImageIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  noImageTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  noImageSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B4513",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  darkUploadButton: {
    backgroundColor: "#D69E2E",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  darkModalContent: {
    backgroundColor: "#2D3748",
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B4513", // Brown theme for consistency
  },
  darkModalTitle: {
    color: "#D69E2E", // Gold theme for dark mode
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  formContainer: {
    backgroundColor: "transparent",
  },
  amountContainer: {
    position: "relative",
  },
  currencySymbol: {
    position: "absolute",
    left: 16,
    top: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#2356A8",
    zIndex: 1,
  },
  darkCurrencySymbol: {
    color: "#D69E2E",
  },
  amountInput: {
    paddingLeft: 35,
  },
  dateButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  darkInputLabel: {
    color: "#FFFFFF",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#374151",
  },
  darkTextInput: {
    backgroundColor: "#1A202C",
    borderColor: "#4A5568",
    color: "#FFFFFF",
  },
  noteInput: {
    height: 80,
    textAlignVertical: "top",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  },
  darkDateButton: {
    backgroundColor: "#1A202C",
    borderColor: "#4A5568",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#374151",
  },
  darkDateButtonText: {
    color: "#FFFFFF",
  },
  dateDoneButton: {
    alignSelf: "flex-end",
    margin: 10,
    padding: 10,
    backgroundColor: "#8B4513",
    borderRadius: 8,
  },
  darkDateDoneButton: {
    backgroundColor: "#D69E2E",
  },
  dateDoneButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  darkDateDoneButtonText: {
    color: "#fff",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    minHeight: 54,
  },
  darkDropdown: {
    backgroundColor: "#1A202C",
    borderColor: "#4A5568",
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  darkDropdownContainer: {
    backgroundColor: "#1A202C",
    borderColor: "#4A5568",
  },
  dropdownText: {
    fontSize: 16,
    color: "#374151",
  },
  darkDropdownText: {
    color: "#FFFFFF",
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  darkDropdownPlaceholder: {
    color: "#A0AEC0",
  },
  searchTextInput: {
    color: "#374151",
  },
  darkSearchTextInput: {
    color: "#FFFFFF",
  },
  badgeTextStyle: {
    color: "#000000",
  },
  darkBadgeTextStyle: {
    color: "#FFFFFF",
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
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  darkModalActions: {
    backgroundColor: "#2D3748", // Add background color
    borderTopColor: "#4A5568",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  darkCancelButton: {
    backgroundColor: "#4A5568",
    borderColor: "#718096",
  },
  saveButton: {
    backgroundColor: "#8B4513", // Brown theme for consistency
  },
  darkSaveButton: {
    backgroundColor: "#D69E2E", // Gold theme for dark mode
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  darkCancelButtonText: {
    color: "#FFFFFF",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  darkSaveButtonText: {
    color: "#fff",
  },

  // Bill Details Modal Styles
  billDetailsSection: {
    marginBottom: 24,
  },
  billDetailsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  darkBillDetailsCard: {
    backgroundColor: "#1A202C",
  },
  billDetailsName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  darkBillDetailsName: {
    color: "#FFFFFF",
  },
  billDetailsAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#8B4513", // Brown theme
    marginBottom: 8,
  },
  darkBillDetailsAmount: {
    color: "#D69E2E",
  },
  billDetailsDate: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 12,
  },
  billDetailsNote: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
  },
  billDetailsSectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  darkBillDetailsSectionTitle: {
    color: "#FFFFFF",
  },
  payerCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  darkPayerCard: {
    backgroundColor: "#064E3B",
    borderColor: "#065F46",
  },
  payerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  payerLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  darkPayerLabel: {
    color: "#FFFFFF",
  },
  payerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  darkPayerName: {
    color: "#FFFFFF",
  },
  payerAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4CAF50",
  },
  darkPayerAmount: {
    color: "#68D391",
  },
  splitMembersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  splitMemberCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  darkSplitMemberCard: {
    backgroundColor: "#2D3748",
    borderColor: "#4A5568",
  },
  payerHighlight: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  darkPayerHighlight: {
    backgroundColor: "#744210",
    borderColor: "#D69E2E",
  },
  splitMemberInfo: {
    flex: 1,
  },
  splitMemberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  splitMemberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  darkSplitMemberName: {
    color: "#FFFFFF",
  },
  payerBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  payerBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  splitAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  splitAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8B4513", // Brown theme
  },
  darkSplitAmount: {
    color: "#D69E2E",
  },
  splitPercentage: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  owesText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "500",
  },
  darkOwesText: {
    color: "#FC8181",
  },
  splitTypeCard: {
    backgroundColor: "#F3F8FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  darkSplitTypeCard: {
    backgroundColor: "#1E3A8A",
    borderColor: "#3B82F6",
  },
  splitTypeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513", // Brown theme
    textAlign: "center",
  },
  darkSplitTypeText: {
    color: "#D69E2E",
  },

  // Custom Split Styles
  customSplitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  darkParticipantName: {
    color: "#FFFFFF",
  },
  customSplitInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
  },
  customSplitPrefix: {
    fontSize: 14,
    color: "#8B4513",
    marginRight: 4,
    fontWeight: "600",
  },
  customSplitInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    color: "#374151",
    textAlign: "right",
  },
  darkCustomSplitInput: {
    backgroundColor: "#374151",
    borderColor: "#4B5563",
    color: "#F9FAFB",
  },
  totalValidation: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  darkTotalValidation: {
    backgroundColor: "#1A202C",
    borderColor: "#4A5568",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  darkTotalText: {
    color: "#FFFFFF",
  },
  expectedText: {
    fontSize: 14,
    color: "#6B7280",
  },
  darkExpectedText: {
    color: "#A0AEC0",
  },
});

// Error Boundary Component for crash protection (commented out to avoid unused warning)
// Uncomment and wrap HistoryScreen if needed for production error handling
/* 
class HistoryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Error caught and handled silently
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20,
          backgroundColor: '#EFE4D2'
        }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            marginBottom: 16,
            color: '#8B4513',
            textAlign: 'center'
          }}>
            📊 History Unavailable
          </Text>
          <Text style={{ 
            fontSize: 16,
            textAlign: 'center', 
            color: '#6B7280',
            marginBottom: 20,
            lineHeight: 22
          }}>
            We're having trouble loading your expense history. Please restart the app or contact support if this persists.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
*/

// PropTypes for HistoryScreen component
HistoryScreen.propTypes = {
  bills: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      currency: PropTypes.string,
      createdAt: PropTypes.string,
      payer: PropTypes.string,
      splitWith: PropTypes.arrayOf(PropTypes.string),
      splitType: PropTypes.string,
      note: PropTypes.string,
      photoUri: PropTypes.string,
    })
  ).isRequired,
  deleteBill: PropTypes.func.isRequired,
  editBill: PropTypes.func.isRequired,
  addBill: PropTypes.func.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      emoji: PropTypes.string,
    })
  ).isRequired,
  profileName: PropTypes.string.isRequired,
  profileEmoji: PropTypes.string,
  darkMode: PropTypes.bool,
};

HistoryScreen.defaultProps = {
  darkMode: false,
};
