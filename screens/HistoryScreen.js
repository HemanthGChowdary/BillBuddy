import React, { useState, useMemo, useCallback } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

// Currency utility function
const getCurrencySymbol = (currency) => {
  const symbols = { USD: "$", CAD: "C$", INR: "₹", MXN: "$" };
  return symbols[currency] || "$";
};

// Get friends dropdown options utility
const getFriendsDropdownOptions = (friends, you) => {
  if (!friends || !Array.isArray(friends)) return [{ label: you, value: you }];

  const friendOptions = friends.map((friend) => ({
    label: `${friend.emoji || "👤"} ${friend.name}`,
    value: friend.name,
  }));

  return [{ label: `👤 ${you}`, value: you }, ...friendOptions];
};

// Currency options
const currencyOptions = [
  { label: "🇺🇸 USD", value: "USD" },
  { label: "🇨🇦 CAD", value: "CAD" },
  { label: "🇮🇳 INR", value: "INR" },
  { label: "🇲🇽 MXN", value: "MXN" },
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
                    color={darkMode ? "#E2E8F0" : "#374151"}
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
                    color="#fff"
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
                  color={darkMode ? "#E2E8F0" : "#374151"}
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

// Optimized Bill Item Component
const BillItem = React.memo(
  ({ item, onEdit, onDelete, onDuplicate, onImagePress, darkMode }) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const formatAmount = (amount, currency) => {
      const symbol = getCurrencySymbol(currency);
      const numAmount = parseFloat(amount);
      return `${symbol}${numAmount.toFixed(2)}`;
    };

    const getSplitText = () => {
      if (!item.splitWith || item.splitWith.length === 0) return "No split";
      if (item.splitWith.length === 1) return `Split with ${item.splitWith[0]}`;
      if (item.splitWith.length === 2)
        return `Split with ${item.splitWith.join(" & ")}`;
      return `Split with ${item.splitWith.length} people`;
    };

    const getSplitTypeText = () => {
      if (item.splitType === "exact") return "💰 Exact amounts";
      if (item.splitType === "percentage") return "📊 By percentage";
      return "⚖️ Equal split";
    };

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
              {formatAmount(item.amount, item.currency)}
            </Text>
          </View>
          <View style={styles.billDateContainer}>
            <Text style={[styles.billDate, darkMode && styles.darkSubtext]}>
              {formatDate(item.date || item.createdAt)}
            </Text>
            {item.photoUri && (
              <TouchableOpacity
                style={styles.photoPreview}
                onPress={() => onImagePress(item)}
                activeOpacity={0.7}
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
                  color={darkMode ? "#A0AEC0" : "#6B7280"}
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
              {getSplitText()}
            </Text>
          </View>

          <View style={styles.billDetailRow}>
            <Text
              style={[
                styles.splitTypeIndicator,
                darkMode && styles.darkSubtext,
              ]}
            >
              {getSplitTypeText()}
            </Text>
          </View>

          {item.note && (
            <View style={styles.billDetailRow}>
              <Ionicons
                name="document-text"
                size={14}
                color={darkMode ? "#A0AEC0" : "#6B7280"}
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

        <View style={styles.billActions}>
          <Pressable
            onPress={() => onDuplicate(item)}
            style={({ pressed }) => [
              styles.actionButton,
              styles.duplicateButton,
              darkMode && styles.darkDuplicateButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.duplicateButtonText,
                darkMode && styles.darkDuplicateButtonText,
              ]}
            >
              Duplicate
            </Text>
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
            style={({ pressed }) => [
              styles.actionButton,
              styles.deleteButton,
              darkMode && styles.darkDeleteButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.deleteButtonText,
                darkMode && styles.darkDeleteButtonText,
              ]}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
);

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
  showDatePicker,
  setShowDatePicker,
  fullFriendsList,
  onSave,
  onCancel,
  isLoading,
  darkMode,
}) => {
  const [errors, setErrors] = useState({});

  const closeAllDropdowns = useCallback(() => {
    setPayerDropdownOpen(false);
    setSplitDropdownOpen(false);
    setCurrencyDropdownOpen(false);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!editBillData?.name?.trim())
      newErrors.name = "Expense name is required";
    const amount = parseFloat(editBillData?.amount);
    if (!editBillData?.amount?.trim() || isNaN(amount) || amount <= 0)
      newErrors.amount = "Valid amount is required";
    if (!payer) newErrors.payer = "Please select who paid";
    if (!splitWith || splitWith.length === 0)
      newErrors.splitWith = "Please select at least one person to split with";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    closeAllDropdowns();
    if (validateForm()) onSave();
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (event.type === "dismissed") return;

    if (selectedDate) {
      setExpenseDate(selectedDate);
    }
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
                color={darkMode ? "#E2E8F0" : "#374151"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={[
              styles.modalScrollContainer,
              darkMode && styles.darkModalContent,
            ]}
            contentContainerStyle={{ padding: 6, paddingBottom: 36 }}
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
                onChangeText={(txt) => {
                  setEditBillData((prev) => ({ ...prev, name: txt }));
                  if (errors.name)
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
                    setEditBillData((prev) => ({ ...prev, amount: txt }));
                    if (errors.amount)
                      setErrors((prev) => ({ ...prev, amount: null }));
                  }}
                  style={[
                    styles.textInput,
                    { paddingLeft: 35 },
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
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  marginLeft={-36}
                />
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
                items={currencyOptions}
                setOpen={(open) => {
                  closeAllDropdowns();
                  setCurrencyDropdownOpen(open);
                }}
                setValue={setCurrency}
                setItems={() => {}}
                style={[styles.dropdown, darkMode && styles.darkDropdown]}
                zIndex={3000}
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
                scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
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
                zIndex={2000}
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
                setValue={setSplitWith}
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
                zIndex={1000}
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

            {/* Note */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, darkMode && styles.darkInputLabel]}
              >
                Note (optional)
              </Text>
              <TextInput
                placeholder="Add a note..."
                placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                value={note}
                onChangeText={setNote}
                style={[
                  styles.textInput,
                  styles.noteInput,
                  darkMode && styles.darkTextInput,
                ]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
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
              style={[styles.modalButton, styles.saveButton]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default function HistoryScreen({
  bills,
  deleteBill,
  editBill,
  addBill,
  friends,
  profileName,
  darkMode = false,
}) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBillData, setEditBillData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [activeFilter, setActiveFilter] = useState("all");

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  // Bill details modal state
  const [billDetailsVisible, setBillDetailsVisible] = useState(false);
  const [selectedBillDetails, setSelectedBillDetails] = useState(null);

  // Form states for edit modal
  const [payer, setPayer] = useState(null);
  const [splitWith, setSplitWith] = useState([]);
  const [note, setNote] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [payerDropdownOpen, setPayerDropdownOpen] = useState(false);
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const you = profileName && profileName.trim() ? profileName.trim() : "You";
  const fullFriendsList = useMemo(
    () => getFriendsDropdownOptions(friends, you),
    [friends, you]
  );

  // Enhanced filtering with date ranges and search
  const filteredAndSortedBills = useMemo(() => {
    let filtered = bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
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

      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          bill.name.toLowerCase().includes(query) ||
          bill.payer.toLowerCase().includes(query) ||
          (bill.note && bill.note.toLowerCase().includes(query)) ||
          bill.amount.toString().includes(query) ||
          (bill.splitWith &&
            bill.splitWith.some((person) =>
              person.toLowerCase().includes(query)
            ))
        );
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return parseFloat(b.amount) - parseFloat(a.amount);
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [bills, searchQuery, sortBy, activeFilter]);

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
    [handleRemovePhoto]
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
    [closeAllDropdowns]
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
  }, []);

  // Camera functions - exact copy from BillsScreen
  const pickImage = useCallback(
    async (billItem) => {
      try {
        if (!billItem) {
          Alert.alert("Error", "No bill selected");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        if (!result.canceled && result.assets?.length > 0) {
          const updatedBill = {
            ...billItem,
            photoUri: result.assets[0].uri,
          };
          editBill(updatedBill);
          Alert.alert("Success!", "Photo updated successfully!");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to select image");
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

        const { status: cameraStatus } =
          await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus !== "granted" || mediaStatus !== "granted") {
          Alert.alert(
            "Permissions Required",
            "Please grant camera and media permissions."
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets?.length > 0) {
          const updatedBill = {
            ...billItem,
            photoUri: result.assets[0].uri,
          };
          editBill(updatedBill);
          Alert.alert("Success!", "Photo updated successfully!");
        }
      } catch (error) {
        Alert.alert("Error", "Unable to launch camera.");
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

    if (splitType === "exact" && splitAmounts) {
      // Exact amounts split
      splitDetails = splitGroup.map((person) => ({
        person,
        owes: splitAmounts[person] || 0,
        isPayer: person === payer,
      }));
    } else if (splitType === "percentage" && splitAmounts) {
      // Percentage split
      splitDetails = splitGroup.map((person) => {
        const percentage = splitAmounts[person] || 0;
        const owesAmount = (amount * percentage) / 100;
        return {
          person,
          owes: owesAmount,
          percentage: percentage,
          isPayer: person === payer,
        };
      });
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
    setPayer(bill.payer || null);
    setSplitWith(bill.splitWith ? [...bill.splitWith] : []);
    setNote(bill.note || "");
    setCurrency(bill.currency || "USD");
    setExpenseDate(bill.date ? new Date(bill.date) : new Date());
    setEditModalVisible(true);
  }, []);

  const handleEditSave = useCallback(async () => {
    setIsLoading(true);
    try {
      let splitGroup = splitWith.includes(payer)
        ? splitWith
        : [payer, ...splitWith];

      await editBill({
        ...editBillData,
        payer: payer,
        splitWith: splitGroup,
        note: note,
        currency: currency,
        date: expenseDate.toISOString(),
      });

      setEditModalVisible(false);
      setEditBillData(null);
      setPayer(null);
      setSplitWith([]);
      setNote("");
      setCurrency("USD");
      setExpenseDate(new Date());

      Alert.alert("Success! 🎉", "Expense updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update expense. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [editBillData, payer, splitWith, note, currency, expenseDate, editBill]);

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
            onPress: () => {
              deleteBill(bill.id);
              Alert.alert("Deleted! 🗑️", "Expense deleted successfully!");
            },
          },
        ]
      );
    },
    [deleteBill]
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
              const duplicatedBill = {
                ...bill,
                id: Date.now().toString(),
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

              await addBill(duplicatedBill);
              Alert.alert("Success! 📋", "Expense duplicated successfully!");
            } catch (error) {
              console.error("Duplicate error:", error);
              Alert.alert(
                "Error",
                "Failed to duplicate expense. Please try again."
              );
            }
          },
        },
      ]);
    },
    [addBill, you]
  );

  const renderBillItem = useCallback(
    ({ item }) => (
      <Pressable
        onPress={() => handleBillPress(item)}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <BillItem
          item={item}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onImagePress={handleImagePress}
          darkMode={darkMode}
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

  const getItemLayout = useCallback(
    (_, index) => ({
      length: 180, // Approximate height of each item
      offset: 180 * index,
      index,
    }),
    []
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
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
            onChangeText={setSearchQuery}
            style={[styles.searchInput, darkMode && styles.darkSearchInput]}
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
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFilter === filter && styles.activeFilterButtonText,
                    darkMode &&
                      !!(activeFilter !== filter) &&
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
              color="#fff" // Always white to match the brown/gold button background
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
        keyExtractor={(item) => `${item.id}-${item.photoUri || "no-photo"}`}
        renderItem={renderBillItem}
        contentContainerStyle={[
          styles.listContainer,
          filteredAndSortedBills.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyComponent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        getItemLayout={getItemLayout}
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
                  color={darkMode ? "#E2E8F0" : "#374151"}
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
                        {selectedBillDetails.splitType === "exact"
                          ? "💰 Exact amounts"
                          : selectedBillDetails.splitType === "percentage"
                          ? "📊 By percentage"
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
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        fullFriendsList={fullFriendsList}
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
    gap: 8,
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
    marginBottom: 20,
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
    backgroundColor: "#2356A8",
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
    backgroundColor: "#4A90E2",
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
    color: "#2356A8",
  },
  darkModalTitle: {
    color: "#D69E2E",
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
    marginBottom: 24,
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
    backgroundColor: "#2356A8",
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
});
