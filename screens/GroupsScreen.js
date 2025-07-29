import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import * as Crypto from "expo-crypto";
import { getCurrencySymbol, getWordCount } from "../utils/helpers";
import { Colors, Typography, Spacing, BorderRadius } from "../styles/theme";

// Constants for better maintainability
const CONSTANTS = {
  // UI Constants
  MAX_GROUP_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_EXPENSE_NAME_LENGTH: 50,
  MAX_NOTE_LENGTH: 100,
  MAX_AMOUNT_VALUE: 99999, // Updated to 99,999 maximum
  MIN_AMOUNT_VALUE: 0.01,
  MAX_WORDS_LIMIT: 100, // Added for word count validation

  // Z-index for dropdowns
  Z_INDEX_HIGH: 3000,
  Z_INDEX_MEDIUM: 2000,
  Z_INDEX_LOW: 1000,

  // Animation durations
  HAPTIC_LIGHT: "Light",
  HAPTIC_MEDIUM: "Medium",

  // Storage keys
  STORAGE_KEY: "billBuddy_groups",
};

// Security utility functions
const sanitizeTextInput = (input, maxLength = 100) => {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>"'&]/g, "") // Remove potentially dangerous characters
    .replace(/[\r\n\t]/g, " ") // Replace newlines and tabs with spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim()
    .substring(0, maxLength);
};

const sanitizeNumericInput = (input) => {
  if (typeof input !== "string") return "";

  // Replace comma with dot for European decimal format support
  let sanitized = input.replace(/,/g, ".");

  // Remove all non-digit and non-dot characters
  sanitized = sanitized.replace(/[^0-9.]/g, "");

  // Handle multiple decimal points - keep only the first one
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    sanitized = parts[0] + "." + parts.slice(1).join("");
  }

  // Remove leading/trailing dots
  sanitized = sanitized.replace(/^\.+|\.+$/g, "");

  return sanitized;
};

const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return (
    !isNaN(num) &&
    num >= CONSTANTS.MIN_AMOUNT_VALUE &&
    num <= CONSTANTS.MAX_AMOUNT_VALUE
  );
};

// Validate word count for descriptions and notes
const validateWordCount = (text) => {
  if (!text || typeof text !== "string") return true;
  const wordCount = getWordCount(text);
  return wordCount <= CONSTANTS.MAX_WORDS_LIMIT;
};

// Get word count helper (using existing utility)
const getWordCountForText = (text) => {
  return getWordCount(text);
};

// Generate secure unique ID
const generateSecureId = () => {
  return `group_${Date.now()}_${
    Crypto.randomUUID
      ? Crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15)
  }`;
};

// Error Boundary Component for better error handling
class GroupsErrorBoundary extends React.Component {
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
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Ionicons name="warning-outline" size={64} color={Colors.error.light} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginTop: 16,
                textAlign: "center",
              }}
            >
              Something went wrong
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Colors.text.secondary.light,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              An error occurred while loading groups. Please restart the app.
            </Text>
            <TouchableOpacity
              onPress={() => this.setState({ hasError: false, error: null })}
              style={{
                backgroundColor: Colors.info.light,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                marginTop: 20,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Currency options with flag emojis for better UX
const localCurrencyOptions = [
  { label: "🇺🇸 USD", value: "USD" },
  { label: "🇨🇦 CAD", value: "CAD" },
  { label: "🇮🇳 INR", value: "INR" },
  { label: "🇲🇽 MXN", value: "MXN" },
];

// Optimized Group Card Component
const GroupCard = React.memo(
  ({ group, onPress, onEdit, onDelete, onManageMembers, you, darkMode }) => {
    const calculateGroupBalance = () => {
      if (!group.bills || group.bills.length === 0) return 0;
      return group.bills.reduce((total, bill) => {
        const amount =
          typeof bill.amount === "string"
            ? parseFloat(bill.amount)
            : bill.amount;
        return total + (isNaN(amount) ? 0 : amount);
      }, 0);
    };

    return (
      <Pressable
        style={({ pressed }) => [
          styles.groupCard,
          darkMode && styles.darkGroupCard,
          pressed && styles.groupCardPressed,
        ]}
        onPress={() => onPress(group)}
        accessibilityRole="button"
        accessibilityLabel={`Group ${group.name || "Unnamed Group"} with ${
          group.members?.length || 0
        } members and ${getCurrencySymbol(
          group.currency || "USD"
        )}${calculateGroupBalance().toFixed(2)} total balance`}
        accessibilityHint="Tap to view group details and manage expenses"
      >
        <View style={styles.groupCardHeader}>
          <View style={styles.groupMainInfo}>
            <Text
              style={[styles.groupName, darkMode && styles.darkText]}
              numberOfLines={1}
            >
              {group.name || "Unnamed Group"}
            </Text>
            <Text
              style={[styles.groupBalance, darkMode && styles.darkGroupBalance]}
            >
              {getCurrencySymbol(group.currency || "USD")}
              {calculateGroupBalance().toFixed(2)}
            </Text>
          </View>
          <View style={styles.groupDateContainer}>
            <Text style={[styles.groupDate, darkMode && styles.darkSubtext]}>
              {group.createdAt
                ? new Date(group.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Unknown"}
            </Text>
          </View>
        </View>

        {/* Enhanced Group Details Section */}
        <View style={styles.groupDetails}>
          <View style={styles.groupStatsColumn}>
            <View style={styles.statRow}>
              <Ionicons
                name="people"
                size={16}
                color={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
              />
              <Text style={[styles.statLabel, darkMode && styles.darkSubtext]}>
                Members
              </Text>
              <Text style={[styles.statValue, darkMode && styles.darkText]}>
                {group.members && group.members.length > 0
                  ? group.members.length
                  : 0}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Ionicons
                name="receipt"
                size={16}
                color={darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
              />
              <Text style={[styles.statLabel, darkMode && styles.darkSubtext]}>
                Bills
              </Text>
              <Text style={[styles.statValue, darkMode && styles.darkText]}>
                {group.bills ? group.bills.length : 0}
              </Text>
            </View>
          </View>

          {/* Recent Expense Preview */}
          {group.bills && group.bills.length > 0 && (
            <View
              style={[
                styles.recentExpensePreview,
                darkMode && styles.darkRecentExpensePreview,
              ]}
            >
              <Text
                style={[
                  styles.recentExpenseLabel,
                  darkMode && styles.darkSubtext,
                ]}
              >
                Latest:{" "}
                {group.bills[group.bills.length - 1]?.description || "Expense"}
              </Text>
              <Text
                style={[
                  styles.recentExpenseAmount,
                  darkMode && styles.darkAmount,
                ]}
              >
                {getCurrencySymbol(group.currency || "USD")}
                {group.bills[group.bills.length - 1]?.amount?.toFixed(2) ||
                  "0.00"}
              </Text>
            </View>
          )}

          {group.description && (
            <Text
              style={[styles.groupDescription, darkMode && styles.darkSubtext]}
              numberOfLines={2}
            >
              {group.description}
            </Text>
          )}

          {/* Action Buttons - Only show to group creator */}
          {group.createdBy === you && (
            <View style={styles.actionButtonsContainer}>
              {/* Add Members Button */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onManageMembers(group);
                }}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.membersButton,
                  darkMode && styles.darkMembersButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[styles.actionButtonText, styles.membersButtonText]}
                >
                  Members
                </Text>
              </Pressable>

              {/* Edit Button */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit(group);
                }}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.editButton,
                  darkMode && styles.darkEditButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.editButtonText,
                    darkMode && styles.darkEditButtonText,
                  ]}
                >
                  Edit
                </Text>
              </Pressable>

              {/* Delete Button */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete(group.id);
                }}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.deleteButton,
                  darkMode && styles.darkDeleteButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.deleteButtonText,
                    darkMode && styles.darkDeleteButtonText,
                  ]}
                >
                  Delete
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    );
  }
);

// PropTypes for GroupCard component
GroupCard.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    currency: PropTypes.string,
    members: PropTypes.arrayOf(PropTypes.string),
    bills: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onManageMembers: PropTypes.func.isRequired,
  you: PropTypes.string.isRequired,
  darkMode: PropTypes.bool,
};

GroupCard.defaultProps = {
  darkMode: false,
};

function GroupsScreen({
  friends,
  profileName,
  profileEmoji,
  darkMode = false,
  addBill,
  editBill,
  deleteBill,
}) {
  const insets = useSafeAreaInsets();
  const navigationSpacing = Math.max(insets.bottom, 20) + 10 + 30;

  // Core state
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form states for group creation/editing
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupDescription, setGroupDescription] = useState("");
  const [groupCurrency, setGroupCurrency] = useState("USD");
  const [membersDropdownOpen, setMembersDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // Bill/expense states
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("");
  const [expenseSplitWith, setExpenseSplitWith] = useState([]);
  const [expenseNote, setExpenseNote] = useState("");
  const [payerDropdownOpen, setPayerDropdownOpen] = useState(false);
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Split type states
  const [splitType, setSplitType] = useState("equal"); // "equal" or "custom"
  const [customSplitAmounts, setCustomSplitAmounts] = useState({});

  const you = profileName && profileName.trim() ? profileName.trim() : "You";

  // Get friends dropdown options
  const friendsDropdownOptions = useMemo(() => {
    if (!friends || !Array.isArray(friends))
      return [{ label: `${profileEmoji || "👤"} ${you}`, value: you }];

    const friendOptions = friends.map((friend) => ({
      label: `${friend.emoji || "👤"} ${friend.name}`,
      value: friend.name,
    }));

    return [
      { label: `${profileEmoji || "👤"} ${you}`, value: you },
      ...friendOptions,
    ];
  }, [friends, you, profileEmoji]);

  // Group member dropdown options for expenses
  const groupMemberOptions = useMemo(() => {
    if (!selectedGroup?.members || selectedGroup.members.length === 0) {
      return [{ label: "No members available", value: "", disabled: true }];
    }

    return selectedGroup.members.map((member) => {
      const memberName =
        typeof member === "string" ? member : member?.name || "";

      // Find friend emoji, use profile emoji for "You", or default to 👤
      let emoji = "👤";
      if (memberName === you) {
        // For profile user, use profile emoji
        emoji = profileEmoji || "👤";
      } else {
        // Find friend emoji
        const friend = friends?.find((f) => f.name === memberName);
        emoji = friend?.emoji || "👤";
      }

      return {
        label:
          memberName === you
            ? `${emoji} ${memberName} (You)`
            : `${emoji} ${memberName}`,
        value: memberName,
      };
    });
  }, [selectedGroup?.members, you, friends, profileEmoji]);

  // Filtered and sorted groups based on search, date filters, and sorting
  const filteredGroups = useMemo(() => {
    let filtered = groups;

    // Apply date filter first
    if (activeFilter !== "all") {
      const now = new Date();
      filtered = groups.filter((group) => {
        if (!group.createdAt) return false;
        const groupDate = new Date(group.createdAt);

        switch (activeFilter) {
          case "thisMonth":
            return (
              groupDate.getMonth() === now.getMonth() &&
              groupDate.getFullYear() === now.getFullYear()
            );
          case "thisWeek":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            return groupDate >= weekStart;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (group) =>
          group.name?.toLowerCase().includes(query) ||
          group.description?.toLowerCase().includes(query) ||
          group.members?.some((member) => {
            const memberName =
              typeof member === "string" ? member : member?.name || "";
            return memberName.toLowerCase().includes(query);
          })
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "members":
          return (b.members?.length || 0) - (a.members?.length || 0);
        case "amount":
          const aBalance =
            a.bills?.reduce(
              (total, bill) => total + (parseFloat(bill.amount) || 0),
              0
            ) || 0;
          const bBalance =
            b.bills?.reduce(
              (total, bill) => total + (parseFloat(bill.amount) || 0),
              0
            ) || 0;
          return bBalance - aBalance;
        case "date":
        default:
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; // Newest first
      }
    });
  }, [groups, searchQuery, activeFilter, sortBy]);

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Load groups from storage with enhanced validation
  const loadGroups = async () => {
    try {
      setLoading(true);
      const savedGroups = await AsyncStorage.getItem(CONSTANTS.STORAGE_KEY);
      if (savedGroups) {
        const parsedGroups = JSON.parse(savedGroups);

        // Validate loaded data structure
        if (Array.isArray(parsedGroups)) {
          const validatedGroups = parsedGroups.filter((group) => {
            return (
              group &&
              typeof group === "object" &&
              group.id &&
              group.name &&
              typeof group.name === "string"
            );
          });
          setGroups(validatedGroups);
        } else {
          // Invalid groups data structure, initializing empty array
          setGroups([]);
        }
      }
    } catch (error) {
      // Error loading groups handled silently
      Alert.alert(
        "Loading Error",
        "There was an issue loading your groups. Starting with an empty list.",
        [{ text: "OK", style: "default" }]
      );
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Save groups to storage with enhanced validation
  const saveGroups = async (updatedGroups) => {
    try {
      // Validate input data
      if (!Array.isArray(updatedGroups)) {
        throw new Error("Groups data must be an array");
      }

      // Sanitize and validate each group
      const sanitizedGroups = updatedGroups.map((group) => {
        if (!group || typeof group !== "object") {
          throw new Error("Invalid group data structure");
        }

        // Validate required fields
        if (!group.id || typeof group.id !== "string") {
          throw new Error("Group must have a valid ID");
        }

        return {
          ...group,
          name: sanitizeTextInput(
            group.name || "",
            CONSTANTS.MAX_GROUP_NAME_LENGTH
          ),
          description: sanitizeTextInput(
            group.description || "",
            CONSTANTS.MAX_DESCRIPTION_LENGTH
          ),
          members: Array.isArray(group.members)
            ? group.members.map((member) => {
                // Always keep members as strings, converting objects to strings if needed
                if (typeof member === "string") {
                  return sanitizeTextInput(
                    member,
                    CONSTANTS.MAX_GROUP_NAME_LENGTH
                  );
                }
                // If it's an object with name property, extract the name as string
                if (member && typeof member === "object" && member.name) {
                  return sanitizeTextInput(
                    member.name,
                    CONSTANTS.MAX_GROUP_NAME_LENGTH
                  );
                }
                // Fallback for invalid member data
                return sanitizeTextInput(
                  String(member),
                  CONSTANTS.MAX_GROUP_NAME_LENGTH
                );
              })
            : [],
          expenses: Array.isArray(group.expenses)
            ? group.expenses.map((expense) => ({
                ...expense,
                name: sanitizeTextInput(
                  expense.name || "",
                  CONSTANTS.MAX_EXPENSE_NAME_LENGTH
                ),
                amount: validateAmount(expense.amount) ? expense.amount : "0",
                note: sanitizeTextInput(
                  expense.note || "",
                  CONSTANTS.MAX_NOTE_LENGTH
                ),
              }))
            : [],
        };
      });

      // Save sanitized data
      await AsyncStorage.setItem(
        CONSTANTS.STORAGE_KEY,
        JSON.stringify(sanitizedGroups)
      );
      setGroups(sanitizedGroups);
    } catch (error) {
      // Error saving groups handled silently
      Alert.alert("Error", `Failed to save changes: ${error.message}`);
    }
  };

  // Enhanced validation functions with better security
  const validateGroupForm = () => {
    const newErrors = {};

    // Enhanced group name validation
    const sanitizedGroupName = sanitizeTextInput(
      newGroupName,
      CONSTANTS.MAX_GROUP_NAME_LENGTH
    );
    if (!sanitizedGroupName || sanitizedGroupName.length < 2) {
      newErrors.groupName = "Group name must be at least 2 characters long";
    } else if (sanitizedGroupName.length > CONSTANTS.MAX_GROUP_NAME_LENGTH) {
      newErrors.groupName = `Group name cannot exceed ${CONSTANTS.MAX_GROUP_NAME_LENGTH} characters`;
    }

    if (!selectedMembers || selectedMembers.length === 0) {
      newErrors.members = "Please select at least one member";
    }

    // Enhanced description validation
    if (groupDescription && groupDescription.trim()) {
      const sanitizedDesc = sanitizeTextInput(
        groupDescription,
        CONSTANTS.MAX_DESCRIPTION_LENGTH
      );
      if (sanitizedDesc.length > CONSTANTS.MAX_DESCRIPTION_LENGTH) {
        newErrors.groupDescription = `Description cannot exceed ${CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateExpenseForm = () => {
    const newErrors = {};

    // Enhanced expense name validation
    const sanitizedExpenseName = sanitizeTextInput(
      expenseName,
      CONSTANTS.MAX_EXPENSE_NAME_LENGTH
    );
    if (!sanitizedExpenseName || sanitizedExpenseName.length < 2) {
      newErrors.expenseName = "Expense name must be at least 2 characters long";
    }

    // Enhanced amount validation
    const sanitizedAmount = sanitizeNumericInput(expenseAmount);
    const amount = parseFloat(sanitizedAmount);
    if (
      !sanitizedAmount ||
      isNaN(amount) ||
      amount < CONSTANTS.MIN_AMOUNT_VALUE
    ) {
      newErrors.expenseAmount = `Amount must be at least ${CONSTANTS.MIN_AMOUNT_VALUE}`;
    } else if (amount > CONSTANTS.MAX_AMOUNT_VALUE) {
      newErrors.expenseAmount = `Amount cannot exceed ${CONSTANTS.MAX_AMOUNT_VALUE}`;
    }

    if (!expensePaidBy) {
      newErrors.expensePaidBy = "Please select who paid";
    }

    if (!expenseSplitWith || expenseSplitWith.length === 0) {
      newErrors.expenseSplitWith =
        "Please select at least one person to split with";
    }

    // Enhanced note validation
    if (expenseNote && expenseNote.trim()) {
      const sanitizedNote = sanitizeTextInput(
        expenseNote,
        CONSTANTS.MAX_NOTE_LENGTH
      );
      if (sanitizedNote.length > CONSTANTS.MAX_NOTE_LENGTH) {
        newErrors.expenseNote = `Note cannot exceed ${CONSTANTS.MAX_NOTE_LENGTH} characters`;
      }
    }

    // Custom split validation
    if (splitType === "custom") {
      const totalCustomAmount = Object.values(customSplitAmounts).reduce(
        (total, amount) => {
          return total + (parseFloat(amount) || 0);
        },
        0
      );
      const expenseAmountNum = parseFloat(expenseAmount);

      if (Math.abs(totalCustomAmount - expenseAmountNum) > 0.01) {
        newErrors.customSplit = `Custom split total (${totalCustomAmount.toFixed(
          2
        )}) must equal expense amount (${expenseAmountNum.toFixed(2)})`;
      }

      // Check if all split members have amounts
      const missingAmounts = expenseSplitWith.filter(
        (member) =>
          !customSplitAmounts[member] ||
          parseFloat(customSplitAmounts[member]) <= 0
      );

      if (missingAmounts.length > 0) {
        newErrors.customSplit = `Please enter valid amounts for all members: ${missingAmounts.join(
          ", "
        )}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Group operations
  const createGroup = async () => {
    if (!validateGroupForm()) return;

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newGroup = {
        id: generateSecureId(),
        name: newGroupName.trim(),
        description: groupDescription.trim(),
        currency: groupCurrency,
        members: [...selectedMembers],
        createdBy: you, // Track who created the group
        createdAt: new Date().toISOString(),
        bills: [],
        settlements: [],
      };

      const updatedGroups = [...groups, newGroup];
      await saveGroups(updatedGroups);

      // Reset form
      resetGroupForm();
      setShowCreateGroup(false);

      Alert.alert("Success! 🎉", "Group created successfully!");
    } catch (error) {
      // Error creating group handled silently
      Alert.alert("Error", "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const editGroup = async () => {
    if (!validateGroupForm() || !editingGroup) return;

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updatedGroups = groups.map((group) =>
        group.id === editingGroup.id
          ? {
              ...group,
              name: newGroupName.trim(),
              description: groupDescription.trim(),
              currency: groupCurrency,
              members: [...selectedMembers],
            }
          : group
      );

      await saveGroups(updatedGroups);

      // Update selected group if it's the one being edited
      if (selectedGroup && selectedGroup.id === editingGroup.id) {
        const updatedSelectedGroup = updatedGroups.find(
          (g) => g.id === editingGroup.id
        );
        setSelectedGroup(updatedSelectedGroup);
      }

      resetGroupForm();
      setShowEditGroup(false);
      setEditingGroup(null);

      Alert.alert("Success! ✏️", "Group updated successfully!");
    } catch (error) {
      // Error editing group handled silently
      Alert.alert("Error", "Failed to update group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGroup = useCallback(
    (groupId) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      Alert.alert(
        "Delete Group",
        `Are you sure you want to delete "${group.name}"? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                const updatedGroups = groups.filter((g) => g.id !== groupId);
                await saveGroups(updatedGroups);

                // Close group details if the deleted group was selected
                if (selectedGroup && selectedGroup.id === groupId) {
                  setSelectedGroup(null);
                  setShowGroupDetails(false);
                }

                Alert.alert("Deleted! 🗑️", "Group deleted successfully!");
              } catch (error) {
                // Error deleting group handled silently
                Alert.alert(
                  "Error",
                  "Failed to delete group. Please try again."
                );
              }
            },
          },
        ]
      );
    },
    [groups, saveGroups, selectedGroup]
  );

  const addExpenseToGroup = async () => {
    if (!validateExpenseForm() || !selectedGroup) return;

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newExpense = {
        id: generateSecureId(),
        name: expenseName.trim(),
        amount: parseFloat(expenseAmount),
        payer: expensePaidBy,
        splitWith: [...expenseSplitWith],
        note: expenseNote.trim(),
        currency: selectedGroup.currency || "USD",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        groupId: selectedGroup.id,
        splitType: splitType,
        customSplitAmounts:
          splitType === "custom" ? { ...customSplitAmounts } : {},
      };

      const updatedGroups = groups.map((group) => {
        if (group.id === selectedGroup.id) {
          return {
            ...group,
            bills: [...(group.bills || []), newExpense],
          };
        }
        return group;
      });

      await saveGroups(updatedGroups);

      // Update selected group
      const updatedSelectedGroup = updatedGroups.find(
        (g) => g.id === selectedGroup.id
      );
      setSelectedGroup(updatedSelectedGroup);

      // Add to global bills for friends balance integration
      if (addBill) {
        const globalBill = {
          id: newExpense.id, // Use same ID
          name: newExpense.name,
          amount: newExpense.amount,
          payer: newExpense.payer,
          splitWith: newExpense.splitWith,
          currency: newExpense.currency,
          date: newExpense.date,
          createdAt: newExpense.createdAt,
          splitType: "equal", // Group expenses use equal split
          splitAmounts: {},
          note: newExpense.note,
          photoUri: null,
          groupId: selectedGroup.id, // Add group reference
          groupName: selectedGroup.name, // Add group name for reference
        };
        await addBill(globalBill);
      }

      resetExpenseForm();
      setShowAddExpense(false);
      setShowGroupDetails(true);

      Alert.alert("Success! 💰", "Expense added successfully!");
    } catch (error) {
      // Error adding expense handled silently
      Alert.alert("Error", "Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const editExpense = async () => {
    if (!validateExpenseForm() || !selectedGroup || !editingExpense) return;

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updatedExpense = {
        ...editingExpense,
        name: expenseName.trim(),
        description: expenseName.trim(),
        amount: parseFloat(expenseAmount),
        paidBy: expensePaidBy,
        splitWith: [...expenseSplitWith],
        note: expenseNote.trim(),
        updatedAt: new Date().toISOString(),
        splitType: splitType,
        customSplitAmounts:
          splitType === "custom" ? { ...customSplitAmounts } : {},
      };

      const updatedGroups = groups.map((group) => {
        if (group.id === selectedGroup.id) {
          return {
            ...group,
            bills: (group.bills || []).map((bill) =>
              bill.id === editingExpense.id ? updatedExpense : bill
            ),
          };
        }
        return group;
      });

      await saveGroups(updatedGroups);

      // Update selected group
      const updatedSelectedGroup = updatedGroups.find(
        (g) => g.id === selectedGroup.id
      );
      setSelectedGroup(updatedSelectedGroup);

      // Update global bill for friends balance integration
      if (editBill) {
        const updatedGlobalBill = {
          id: updatedExpense.id,
          name: updatedExpense.name,
          amount: updatedExpense.amount,
          payer: updatedExpense.paidBy || updatedExpense.payer,
          splitWith: updatedExpense.splitWith,
          currency: selectedGroup.currency || "USD",
          date: updatedExpense.date || editingExpense.date,
          createdAt: editingExpense.createdAt,
          updatedAt: updatedExpense.updatedAt,
          splitType: "equal",
          splitAmounts: {},
          note: updatedExpense.note,
          photoUri: null,
          groupId: selectedGroup.id,
          groupName: selectedGroup.name,
        };
        await editBill(updatedGlobalBill);
      }

      resetExpenseForm();
      setShowEditExpense(false);
      setEditingExpense(null);
      setShowGroupDetails(true);

      Alert.alert("Success! ✏️", "Expense updated successfully!");
    } catch (error) {
      // Error editing expense handled silently
      Alert.alert("Error", "Failed to update expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const resetGroupForm = () => {
    setNewGroupName("");
    setGroupDescription("");
    setGroupCurrency("USD");
    setSelectedMembers([]);
    setErrors({});
    setMembersDropdownOpen(false);
    setCurrencyDropdownOpen(false);
  };

  const resetExpenseForm = () => {
    setExpenseName("");
    setExpenseAmount("");
    setExpensePaidBy("");
    setExpenseSplitWith([]);
    setExpenseNote("");
    setEditingExpense(null);
    setErrors({});
    setPayerDropdownOpen(false);
    setSplitDropdownOpen(false);
    setSplitType("equal");
    setCustomSplitAmounts({});
  };

  const closeAllDropdowns = useCallback(() => {
    setMembersDropdownOpen(false);
    setCurrencyDropdownOpen(false);
    setPayerDropdownOpen(false);
    setSplitDropdownOpen(false);
  }, []);

  // Memoized callback functions for better performance
  const handleGroupPress = useCallback((group) => {
    setSelectedGroup(group);
    setShowGroupDetails(true);
  }, []);

  const handleEditGroup = useCallback((group) => {
    setEditingGroup(group);
    setNewGroupName(group.name || "");
    setGroupDescription(group.description || "");
    setGroupCurrency(group.currency || "USD");

    // Extract member names properly for dropdown
    const memberNames = (group.members || [])
      .map((member) =>
        typeof member === "string" ? member : member?.name || ""
      )
      .filter((name) => name.length > 0);

    setSelectedMembers(memberNames);
    setShowEditGroup(true);
  }, []);

  const handleManageMembers = useCallback((group) => {
    setSelectedGroup(group);
    setShowManageMembers(true);
  }, []);

  const handleEditExpense = (expense, group) => {
    setEditingExpense(expense);
    setSelectedGroup(group);
    setExpenseName(expense.description || expense.name || "");
    setExpenseAmount(expense.amount?.toString() || "");
    setExpensePaidBy(expense.payer || expense.paidBy || "");
    setExpenseSplitWith(expense.splitWith || []);
    setExpenseNote(expense.note || "");
    setSplitType(expense.splitType || "equal");
    setCustomSplitAmounts(expense.customSplitAmounts || {});
    setShowEditExpense(true);
  };

  const renderGroupItem = useCallback(
    ({ item }) => (
      <GroupCard
        group={item}
        onPress={handleGroupPress}
        onEdit={handleEditGroup}
        onDelete={deleteGroup}
        onManageMembers={handleManageMembers}
        you={you}
        darkMode={darkMode}
      />
    ),
    [
      darkMode,
      handleGroupPress,
      handleEditGroup,
      deleteGroup,
      handleManageMembers,
      you,
    ]
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, darkMode && styles.darkEmptyIcon]}>
        <Ionicons
          name="people-circle-outline"
          size={64}
          color={darkMode ? Colors.gray600 : Colors.gray300}
        />
      </View>
      <Text style={[styles.emptyTitle, darkMode && styles.darkText]}>
        {searchQuery || activeFilter !== "all"
          ? "No groups found"
          : "No groups yet"}
      </Text>
      <Text style={[styles.emptySubtitle, darkMode && styles.darkSubtext]}>
        {searchQuery || activeFilter !== "all"
          ? "Try adjusting your search or filters"
          : "Create your first group to start splitting expenses with friends!"}
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

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, darkMode && styles.darkContainer]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={darkMode ? Colors.text.accent.dark : Colors.primary}
          />
          <Text style={[styles.loadingText, darkMode && styles.darkText]}>
            Loading groups...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView
        style={[styles.container, darkMode && styles.darkContainer]}
      >
        <StatusBar
          barStyle={darkMode ? "light-content" : "dark-content"}
          backgroundColor={darkMode ? Colors.background.dark : Colors.background.light}
        />
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, darkMode && styles.darkTitle]}>
            Groups Screen
          </Text>
          <Text style={[styles.subtitle, darkMode && styles.darkSubtext]}>
            Manage group expenses together
          </Text>
        </View>

        {/* Search Bar */}
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
              placeholder="Search groups..."
              placeholderTextColor={darkMode ? "#A0AEC0" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, darkMode && styles.darkSearchInput]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearch}
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

        {/* Add Group Button */}
        <View style={styles.addButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.addGroupButton,
              darkMode && styles.darkAddGroupButton,
              pressed && styles.addGroupButtonPressed,
            ]}
            onPress={() => setShowCreateGroup(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addGroupButtonText}>Create New Group</Text>
          </Pressable>
        </View>

        {/* Filters and Sort Container */}
        {groups.length > 0 && (
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
                  accessibilityLabel={`Filter groups by ${
                    filter === "all"
                      ? "all groups"
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
                const sortOptions = ["date", "name", "members", "amount"];
                const currentIndex = sortOptions.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setSortBy(sortOptions[nextIndex]);
              }}
              style={[styles.sortButton, darkMode && styles.darkSortButton]}
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${sortBy}. Tap to change sorting`}
            >
              <Ionicons name="swap-vertical" size={16} color="#fff" />
              <Text
                style={[
                  styles.sortButtonText,
                  darkMode && styles.darkSortButtonText,
                ]}
              >
                {sortBy === "date"
                  ? "Date"
                  : sortBy === "name"
                  ? "Name"
                  : sortBy === "members"
                  ? "Members"
                  : "Amount"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Groups List */}
        <FlatList
          style={{ flex: 1 }}
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: navigationSpacing },
            filteredGroups.length === 0 && styles.emptyListContainer,
            { flexGrow: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyComponent}
          ItemSeparatorComponent={null}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
          updateCellsBatchingPeriod={50}
        />

        {/* Create Group Modal */}
        <Modal
          visible={showCreateGroup}
          transparent
          animationType="slide"
          onRequestClose={() => {
            closeAllDropdowns();
            setShowCreateGroup(false);
            resetGroupForm();
          }}
        >
          <View
            style={[styles.modalOverlay, darkMode && styles.darkModalOverlay]}
          >
            <KeyboardAvoidingView
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text style={[styles.modalTitle, darkMode && styles.darkTitle]}>
                  Create Group
                </Text>
                <Pressable
                  onPress={() => {
                    closeAllDropdowns();
                    setShowCreateGroup(false);
                    resetGroupForm();
                  }}
                  style={({ pressed }) => [
                    { padding: 4 },
                    pressed && { opacity: 0.5 },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={darkMode ? Colors.text.primary.dark : Colors.text.primary.light}
                  />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollContainer}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {/* Group Name */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Group Name *
                  </Text>
                  <TextInput
                    placeholder="Enter group name"
                    placeholderTextColor={darkMode ? "#888" : "#999"}
                    value={newGroupName}
                    onChangeText={(text) => {
                      const sanitizedText = sanitizeTextInput(
                        text,
                        CONSTANTS.MAX_GROUP_NAME_LENGTH
                      );
                      setNewGroupName(sanitizedText);
                      if (errors.groupName)
                        setErrors((prev) => ({ ...prev, groupName: null }));
                    }}
                    style={[
                      styles.textInput,
                      darkMode && styles.darkTextInput,
                      errors.groupName && styles.inputError,
                    ]}
                    maxLength={CONSTANTS.MAX_GROUP_NAME_LENGTH}
                    accessibilityLabel="Group name input"
                    accessibilityHint="Enter a name for your group"
                  />
                  {errors.groupName && (
                    <Text style={styles.errorText}>{errors.groupName}</Text>
                  )}
                </View>

                {/* Members */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Add Members *
                  </Text>
                  {friendsDropdownOptions.length <= 1 ? (
                    <View style={styles.noFriendsContainer}>
                      <Text style={styles.noFriendsText}>
                        Add friends first to create groups with them
                      </Text>
                    </View>
                  ) : (
                    <DropDownPicker
                      multiple
                      min={1}
                      placeholder="Select members"
                      open={membersDropdownOpen}
                      value={selectedMembers}
                      items={friendsDropdownOptions}
                      setOpen={(open) => {
                        closeAllDropdowns();
                        setMembersDropdownOpen(open);
                      }}
                      setValue={setSelectedMembers}
                      setItems={() => {}}
                      style={[
                        styles.dropdown,
                        darkMode && styles.darkDropdown,
                        errors.members && styles.inputError,
                      ]}
                      dropDownContainerStyle={[
                        styles.dropdownContainer,
                        darkMode && styles.darkDropdownContainer,
                      ]}
                      textStyle={[
                        styles.dropdownText,
                        darkMode && styles.darkText,
                      ]}
                      placeholderStyle={[
                        styles.dropdownPlaceholder,
                        darkMode && styles.darkSubtext,
                      ]}
                      arrowIconStyle={{
                        tintColor: darkMode ? "#D69E2E" : "#8B4513",
                      }}
                      tickIconStyle={{
                        tintColor: darkMode ? "#D69E2E" : "#8B4513",
                      }}
                      closeIconStyle={{
                        tintColor: darkMode ? "#D69E2E" : "#8B4513",
                      }}
                      mode="BADGE"
                      searchable={true}
                      searchPlaceholder="Search members..."
                      searchTextInputStyle={[
                        styles.searchTextInput,
                        darkMode && styles.darkSearchTextInput,
                      ]}
                      listMode="SCROLLVIEW"
                      scrollViewProps={{
                        keyboardShouldPersistTaps: "handled",
                        nestedScrollEnabled: true,
                        showsVerticalScrollIndicator: true,
                        bounces: true,
                        decelerationRate: "fast",
                      }}
                      maxHeight={300}
                      dropDownDirection="DOWN"
                      zIndex={3000}
                      autoScroll={true}
                      itemSeparator={false}
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
                      badgeTextStyle={{ color: "black" }}
                    />
                  )}
                  {errors.members && (
                    <Text style={styles.errorText}>{errors.members}</Text>
                  )}
                </View>

                {/* Currency */}
                <View style={[styles.inputGroup]}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Currency
                  </Text>
                  <DropDownPicker
                    placeholder="Select currency"
                    open={currencyDropdownOpen}
                    value={groupCurrency}
                    items={localCurrencyOptions}
                    setOpen={(open) => {
                      closeAllDropdowns();
                      setCurrencyDropdownOpen(open);
                    }}
                    setValue={setGroupCurrency}
                    setItems={() => {}}
                    style={[styles.dropdown, darkMode && styles.darkDropdown]}
                    zIndex={2000}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      darkMode && styles.darkDropdownContainer,
                    ]}
                    textStyle={[
                      styles.dropdownText,
                      darkMode && styles.darkText,
                    ]}
                    placeholderStyle={[
                      styles.dropdownPlaceholder,
                      darkMode && styles.darkSubtext,
                    ]}
                    arrowIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    tickIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      keyboardShouldPersistTaps: "handled",
                      nestedScrollEnabled: true,
                      showsVerticalScrollIndicator: true,
                      bounces: true,
                      decelerationRate: "fast",
                    }}
                    maxHeight={280}
                    dropDownDirection="BOTTOM"
                    itemSeparator={false}
                  />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Description (optional)
                  </Text>
                  <TextInput
                    placeholder="What's this group for?"
                    placeholderTextColor={darkMode ? "#888" : "#999"}
                    value={groupDescription}
                    onChangeText={(text) => {
                      if (validateWordCount(text)) {
                        setGroupDescription(text);
                      }
                    }}
                    style={[
                      styles.textInput,
                      styles.noteInput,
                      darkMode && styles.darkTextInput,
                    ]}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    maxLength={200}
                  />
                  {groupDescription && (
                    <Text
                      style={[
                        styles.wordCountText,
                        darkMode && styles.darkSubtext,
                      ]}
                    >
                      {getWordCountForText(groupDescription)}/
                      {CONSTANTS.MAX_WORDS_LIMIT} words
                    </Text>
                  )}
                </View>
              </ScrollView>

              {/* Actions */}
              <View
                style={[
                  styles.modalActions,
                  darkMode && styles.darkModalActions,
                ]}
              >
                <Pressable
                  onPress={() => {
                    closeAllDropdowns();
                    setShowCreateGroup(false);
                    resetGroupForm();
                  }}
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                    pressed && { opacity: 0.7 },
                  ]}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      darkMode && styles.darkCancelButtonText,
                    ]}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={createGroup}
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.saveButton,
                    darkMode && styles.darkSaveButton,
                    pressed && { opacity: 0.8 },
                  ]}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      style={[
                        styles.saveButtonText,
                        darkMode && styles.darkSaveButtonText,
                      ]}
                    >
                      Create Group
                    </Text>
                  )}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Edit Group Modal */}
        <Modal
          visible={showEditGroup}
          transparent
          animationType="slide"
          onRequestClose={() => {
            closeAllDropdowns();
            setShowEditGroup(false);
            setEditingGroup(null);
            resetGroupForm();
          }}
        >
          <View
            style={[styles.modalOverlay, darkMode && styles.darkModalOverlay]}
          >
            <KeyboardAvoidingView
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text style={[styles.modalTitle, darkMode && styles.darkTitle]}>
                  Edit Group
                </Text>
                <Pressable
                  onPress={() => {
                    closeAllDropdowns();
                    setShowEditGroup(false);
                    setEditingGroup(null);
                    resetGroupForm();
                  }}
                  style={({ pressed }) => [
                    { padding: 4 },
                    pressed && { opacity: 0.5 },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={darkMode ? Colors.text.primary.dark : Colors.text.primary.light}
                  />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollContainer}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {/* Group Name */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Group Name *
                  </Text>
                  <TextInput
                    placeholder="Enter group name"
                    placeholderTextColor={darkMode ? "#888" : "#999"}
                    value={newGroupName}
                    onChangeText={(text) => {
                      const sanitizedText = sanitizeTextInput(
                        text,
                        CONSTANTS.MAX_GROUP_NAME_LENGTH
                      );
                      setNewGroupName(sanitizedText);
                      if (errors.groupName)
                        setErrors((prev) => ({ ...prev, groupName: null }));
                    }}
                    style={[
                      styles.textInput,
                      darkMode && styles.darkTextInput,
                      errors.groupName && styles.inputError,
                    ]}
                    maxLength={CONSTANTS.MAX_GROUP_NAME_LENGTH}
                    accessibilityLabel="Group name input"
                    accessibilityHint="Enter a name for your group"
                  />
                  {errors.groupName && (
                    <Text style={styles.errorText}>{errors.groupName}</Text>
                  )}
                </View>

                {/* Members */}
                <View style={[styles.inputGroup, { marginBottom: 32 }]}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Members *
                  </Text>
                  {friendsDropdownOptions.length <= 1 ? (
                    <View style={styles.noFriendsContainer}>
                      <Text style={styles.noFriendsText}>
                        Add friends first to manage group members
                      </Text>
                    </View>
                  ) : (
                    <DropDownPicker
                      multiple
                      min={1}
                      placeholder="Select members"
                      open={membersDropdownOpen}
                      value={selectedMembers}
                      items={friendsDropdownOptions}
                      setOpen={(open) => {
                        closeAllDropdowns();
                        setMembersDropdownOpen(open);
                      }}
                      setValue={setSelectedMembers}
                      setItems={() => {}}
                      style={[
                        styles.dropdown,
                        darkMode && styles.darkDropdown,
                        errors.members && styles.inputError,
                      ]}
                      dropDownContainerStyle={[
                        styles.dropdownContainer,
                        darkMode && styles.darkDropdownContainer,
                      ]}
                      textStyle={[
                        styles.dropdownText,
                        darkMode && styles.darkText,
                      ]}
                      placeholderStyle={[
                        styles.dropdownPlaceholder,
                        darkMode && styles.darkSubtext,
                      ]}
                      arrowIconStyle={{
                        tintColor: darkMode ? "#D69E2E" : "#8B4513",
                      }}
                      tickIconStyle={{
                        tintColor: darkMode ? "#D69E2E" : "#8B4513",
                      }}
                      closeIconStyle={{
                        tintColor: darkMode ? "#D69E2E" : "#8B4513",
                      }}
                      mode="BADGE"
                      searchable={true}
                      searchPlaceholder="Search members..."
                      searchTextInputStyle={[
                        styles.searchTextInput,
                        darkMode && styles.darkSearchTextInput,
                      ]}
                      listMode="SCROLLVIEW"
                      scrollViewProps={{
                        keyboardShouldPersistTaps: "handled",
                        nestedScrollEnabled: true,
                        showsVerticalScrollIndicator: true,
                        bounces: true,
                        decelerationRate: "fast",
                      }}
                      maxHeight={300}
                      dropDownDirection="BOTTOM"
                      zIndex={3000}
                      autoScroll={true}
                      itemSeparator={false}
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
                      badgeTextStyle={{ color: "black" }}
                    />
                  )}
                  {errors.members && (
                    <Text style={styles.errorText}>{errors.members}</Text>
                  )}
                </View>

                {/* Currency */}
                <View style={[styles.inputGroup]}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Currency
                  </Text>
                  <DropDownPicker
                    placeholder="Select currency"
                    open={currencyDropdownOpen}
                    value={groupCurrency}
                    items={localCurrencyOptions}
                    setOpen={(open) => {
                      closeAllDropdowns();
                      setCurrencyDropdownOpen(open);
                    }}
                    setValue={setGroupCurrency}
                    setItems={() => {}}
                    style={[styles.dropdown, darkMode && styles.darkDropdown]}
                    zIndex={2000}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      darkMode && styles.darkDropdownContainer,
                    ]}
                    textStyle={[
                      styles.dropdownText,
                      darkMode && styles.darkText,
                    ]}
                    placeholderStyle={[
                      styles.dropdownPlaceholder,
                      darkMode && styles.darkSubtext,
                    ]}
                    arrowIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    tickIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      keyboardShouldPersistTaps: "handled",
                      nestedScrollEnabled: true,
                      showsVerticalScrollIndicator: true,
                      bounces: true,
                      decelerationRate: "fast",
                    }}
                    maxHeight={280}
                    dropDownDirection="BOTTOM"
                    itemSeparator={false}
                  />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Description (optional)
                  </Text>
                  <TextInput
                    placeholder="What's this group for?"
                    placeholderTextColor={darkMode ? "#888" : "#999"}
                    value={groupDescription}
                    onChangeText={(text) => {
                      if (validateWordCount(text)) {
                        setGroupDescription(text);
                      }
                    }}
                    style={[
                      styles.textInput,
                      styles.noteInput,
                      darkMode && styles.darkTextInput,
                    ]}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    maxLength={200}
                  />
                  {groupDescription && (
                    <Text
                      style={[
                        styles.wordCountText,
                        darkMode && styles.darkSubtext,
                      ]}
                    >
                      {getWordCountForText(groupDescription)}/
                      {CONSTANTS.MAX_WORDS_LIMIT} words
                    </Text>
                  )}
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    closeAllDropdowns();
                    setShowEditGroup(false);
                    setEditingGroup(null);
                    resetGroupForm();
                  }}
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                    pressed && { opacity: 0.7 },
                  ]}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      darkMode && styles.darkCancelButtonText,
                    ]}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={editGroup}
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.saveButton,
                    darkMode && styles.darkSaveButton,
                    pressed && { opacity: 0.8 },
                  ]}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
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
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Group Details Modal */}
        <Modal
          visible={showGroupDetails}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowGroupDetails(false);
            setSelectedGroup(null);
          }}
        >
          <View
            style={[styles.modalOverlay, darkMode && styles.darkModalOverlay]}
          >
            <KeyboardAvoidingView
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text
                  style={[styles.modalTitle, darkMode && styles.darkTitle]}
                  numberOfLines={1}
                >
                  {selectedGroup?.name || "Group Details"}
                </Text>
                <View style={styles.modalHeaderActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowGroupDetails(false);
                      setTimeout(() => {
                        setShowAddExpense(true);
                      }, 100);
                    }}
                    style={[
                      styles.addExpenseButton,
                      darkMode && styles.darkAddExpenseButton,
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={16}
                      color={darkMode ? Colors.text.accent.dark : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.addExpenseButtonText,
                        darkMode && styles.darkAddExpenseButtonText,
                      ]}
                    >
                      Add Expense
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowGroupDetails(false);
                      setSelectedGroup(null);
                    }}
                    style={styles.closeModalButton}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={darkMode ? Colors.text.primary.dark : Colors.text.primary.light}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.modalScrollContainer}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* Group Info */}
                <View style={styles.groupInfoSection}>
                  <View
                    style={[
                      styles.groupInfoCard,
                      darkMode && styles.darkGroupInfoCard,
                    ]}
                  >
                    <View style={styles.groupInfoRow}>
                      <Ionicons
                        name="people"
                        size={20}
                        color={darkMode ? Colors.text.accent.dark : Colors.primary}
                      />
                      <Text
                        style={[
                          styles.groupInfoLabel,
                          darkMode && styles.darkText,
                        ]}
                      >
                        Members
                      </Text>
                      <Text
                        style={[
                          styles.groupInfoValue,
                          darkMode && styles.darkSubtext,
                        ]}
                      >
                        {selectedGroup?.members?.length || 0}
                      </Text>
                    </View>
                    <View style={styles.groupInfoRow}>
                      <Ionicons
                        name="receipt"
                        size={20}
                        color={darkMode ? Colors.text.accent.dark : Colors.primary}
                      />
                      <Text
                        style={[
                          styles.groupInfoLabel,
                          darkMode && styles.darkText,
                        ]}
                      >
                        Expenses
                      </Text>
                      <Text
                        style={[
                          styles.groupInfoValue,
                          darkMode && styles.darkSubtext,
                        ]}
                      >
                        {selectedGroup?.bills?.length || 0}
                      </Text>
                    </View>
                    <View style={styles.groupInfoRow}>
                      <Ionicons
                        name="cash"
                        size={20}
                        color={darkMode ? Colors.text.accent.dark : Colors.primary}
                      />
                      <Text
                        style={[
                          styles.groupInfoLabel,
                          darkMode && styles.darkText,
                        ]}
                      >
                        Total
                      </Text>
                      <Text
                        style={[
                          styles.groupInfoValue,
                          styles.totalAmount,
                          darkMode && styles.darkAmount,
                        ]}
                      >
                        {getCurrencySymbol(selectedGroup?.currency || "USD")}
                        {(
                          selectedGroup?.bills?.reduce((sum, bill) => {
                            const amount =
                              typeof bill.amount === "string"
                                ? parseFloat(bill.amount)
                                : bill.amount;
                            return sum + (isNaN(amount) ? 0 : amount);
                          }, 0) || 0
                        ).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {selectedGroup?.description && (
                    <View
                      style={[
                        styles.descriptionCard,
                        darkMode && styles.darkDescriptionCard,
                      ]}
                    >
                      <Text
                        style={[
                          styles.descriptionText,
                          darkMode && styles.darkSubtext,
                        ]}
                      >
                        {selectedGroup.description}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Members List */}
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, darkMode && styles.darkText]}
                  >
                    Members ({selectedGroup?.members?.length || 0})
                  </Text>

                  {/* Member Avatars */}
                  {selectedGroup?.members?.length > 0 && (
                    <View style={styles.memberAvatarsContainer}>
                      {selectedGroup.members
                        .slice(0, 5)
                        .map((member, index) => {
                          const memberName =
                            typeof member === "string"
                              ? member
                              : member?.name || "";
                          const cleanMemberName = memberName.trim();
                          const initials =
                            cleanMemberName.length > 0
                              ? cleanMemberName.substring(0, 2).toUpperCase()
                              : "??";
                          return (
                            <View
                              key={`avatar-${index}-${
                                cleanMemberName || index
                              }`}
                              style={[
                                styles.memberAvatar,
                                darkMode && styles.darkMemberAvatar,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.memberAvatarText,
                                  darkMode && styles.darkText,
                                ]}
                              >
                                {initials}
                              </Text>
                            </View>
                          );
                        })}
                      {selectedGroup.members.length > 5 && (
                        <View
                          style={[
                            styles.memberAvatar,
                            styles.moreAvatar,
                            darkMode && styles.darkMemberAvatar,
                          ]}
                        >
                          <Text
                            style={[
                              styles.memberAvatarText,
                              darkMode && styles.darkText,
                            ]}
                          >
                            +{selectedGroup.members.length - 5}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Recent Expenses */}
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, darkMode && styles.darkText]}
                  >
                    Recent Expenses ({selectedGroup?.bills?.length || 0})
                  </Text>
                  {selectedGroup?.bills?.length > 0 ? (
                    <View style={styles.expensesList}>
                      {selectedGroup.bills
                        .slice()
                        .reverse()
                        .slice(0, 5)
                        .map((bill) => (
                          <View
                            key={bill.id}
                            style={[
                              styles.expenseItem,
                              darkMode && styles.darkExpenseItem,
                            ]}
                          >
                            <View style={styles.expenseHeader}>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.expenseName,
                                    darkMode && styles.darkText,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {bill.name || bill.description}
                                </Text>
                                <Text
                                  style={[
                                    styles.expenseAmount,
                                    darkMode && styles.darkAmount,
                                  ]}
                                >
                                  {getCurrencySymbol(
                                    bill.currency ||
                                      selectedGroup?.currency ||
                                      "USD"
                                  )}
                                  {(bill.amount || 0).toFixed(2)}
                                </Text>
                                <Text
                                  style={[
                                    styles.expenseDetail,
                                    darkMode && styles.darkSubtext,
                                  ]}
                                >
                                  Paid by {bill.payer || "Unknown"}
                                </Text>
                              </View>
                              <View style={styles.expenseDateContainer}>
                                <Text
                                  style={[
                                    styles.expenseDate,
                                    darkMode && styles.darkSubtext,
                                  ]}
                                >
                                  {new Date(
                                    bill.date || bill.createdAt
                                  ).toLocaleDateString()}
                                </Text>
                              </View>
                            </View>

                            {/* Clean Details Section like HistoryScreen */}
                            <View style={styles.billDetails}>
                              <View style={styles.billDetailRow}>
                                <Ionicons
                                  name="people"
                                  size={16}
                                  color="#CBD5E0"
                                />
                                <Text
                                  style={styles.billDetailText}
                                >
                                  {bill.splitWith && bill.splitWith.length > 1 
                                    ? `Split with ${bill.splitWith.filter(p => p !== bill.payer).join(' & ')}`
                                    : 'No split'
                                  }
                                </Text>
                              </View>

                              <View style={styles.billDetailRow}>
                                <Text
                                  style={styles.splitTypeIndicator}
                                >
                                  {bill.splitType === "custom" ? "💰 Custom split" : "⚖️ Equal split"}
                                </Text>
                              </View>
                            </View>

                            {/* Edit and Delete buttons - Only show if current user is the payer */}
                              {bill.payer === you && (
                                <View style={styles.expenseActions}>
                                  <Pressable
                                    style={({ pressed }) => [
                                      styles.expenseActionButton,
                                      {
                                        backgroundColor: darkMode 
                                          ? Colors.edit.background.dark 
                                          : Colors.edit.background.light,
                                        borderColor: darkMode 
                                          ? Colors.edit.border.dark 
                                          : Colors.edit.border.light,
                                      },
                                      pressed && { opacity: 0.7 },
                                    ]}
                                    onPress={() => {
                                      setShowGroupDetails(false);
                                      handleEditExpense(bill, selectedGroup);
                                    }}
                                  >
                                    <Ionicons 
                                      name="pencil" 
                                      size={14} 
                                      color={darkMode ? Colors.edit.text.dark : Colors.edit.text.light}
                                      style={{ marginRight: 4 }}
                                    />
                                    <Text style={[
                                      styles.editExpenseText,
                                      { color: darkMode ? Colors.edit.text.dark : Colors.edit.text.light }
                                    ]}>
                                      Edit
                                    </Text>
                                  </Pressable>

                                  <Pressable
                                    style={({ pressed }) => [
                                      styles.expenseActionButton,
                                      {
                                        backgroundColor: darkMode 
                                          ? Colors.delete.background.dark 
                                          : Colors.delete.background.light,
                                        borderColor: darkMode 
                                          ? Colors.delete.border.dark 
                                          : Colors.delete.border.light,
                                      },
                                      pressed && { opacity: 0.7 },
                                    ]}
                                    onPress={() => {
                                      Alert.alert(
                                        "Delete Expense",
                                        `Are you sure you want to delete "${
                                          bill.name || bill.description
                                        }"?`,
                                        [
                                          { text: "Cancel", style: "cancel" },
                                          {
                                            text: "Delete",
                                            style: "destructive",
                                            onPress: () => {
                                              const updatedGroups = groups.map(
                                                (g) =>
                                                  g.id === selectedGroup.id
                                                    ? {
                                                        ...g,
                                                        bills:
                                                          g.bills?.filter(
                                                            (b) =>
                                                              b.id !== bill.id
                                                          ) || [],
                                                      }
                                                    : g
                                              );
                                              saveGroups(updatedGroups);
                                              // Update selectedGroup to reflect changes immediately
                                              const updatedSelectedGroup =
                                                updatedGroups.find(
                                                  (g) =>
                                                    g.id === selectedGroup.id
                                                );
                                              setSelectedGroup(
                                                updatedSelectedGroup
                                              );

                                              // Delete from global bills for friends balance integration
                                              if (deleteBill) {
                                                deleteBill(bill.id);
                                              }

                                              Alert.alert(
                                                "Success",
                                                "Expense deleted!"
                                              );
                                            },
                                          },
                                        ]
                                      );
                                    }}
                                  >
                                    <Ionicons 
                                      name="trash" 
                                      size={14} 
                                      color={darkMode ? Colors.delete.text.dark : Colors.delete.text.light}
                                      style={{ marginRight: 4 }}
                                    />
                                    <Text style={[
                                      styles.deleteExpenseText,
                                      { color: darkMode ? Colors.delete.text.dark : Colors.delete.text.light }
                                    ]}>
                                      Delete
                                    </Text>
                                  </Pressable>
                                </View>
                              )}

                            {bill.note && (
                              <Text
                                style={[
                                  styles.expenseNote,
                                  darkMode && styles.darkSubtext,
                                ]}
                                numberOfLines={2}
                              >
                                Note: {bill.note}
                              </Text>
                            )}
                          </View>
                        ))}
                      {selectedGroup.bills.length > 5 && (
                        <Text
                          style={[
                            styles.moreExpensesText,
                            darkMode && styles.darkSubtext,
                          ]}
                        >
                          + {selectedGroup.bills.length - 5} more expenses
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.noDataText,
                        darkMode && styles.darkSubtext,
                      ]}
                    >
                      No expenses yet. Add your first expense!
                    </Text>
                  )}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Add Expense Modal */}
        <Modal
          visible={showAddExpense}
          transparent
          animationType="slide"
          onRequestClose={() => {
            closeAllDropdowns();
            setShowAddExpense(false);
            resetExpenseForm();
            setShowGroupDetails(true);
          }}
        >
          <View
            style={[styles.modalOverlay, darkMode && styles.darkModalOverlay]}
          >
            <KeyboardAvoidingView
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text style={[styles.modalTitle, darkMode && styles.darkTitle]}>
                  Add Expense
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowAddExpense(false);
                    resetExpenseForm();
                    setShowGroupDetails(true);
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={darkMode ? Colors.text.primary.dark : Colors.text.primary.light}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollContainer}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {/* Expense Name */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Expense Name *
                  </Text>
                  <TextInput
                    placeholder="What did you spend on?"
                    placeholderTextColor={darkMode ? "#888" : "#999"}
                    value={expenseName}
                    onChangeText={(text) => {
                      const sanitizedText = sanitizeTextInput(
                        text,
                        CONSTANTS.MAX_EXPENSE_NAME_LENGTH
                      );
                      setExpenseName(sanitizedText);
                      if (errors.expenseName)
                        setErrors((prev) => ({ ...prev, expenseName: null }));
                    }}
                    style={[
                      styles.textInput,
                      darkMode && styles.darkTextInput,
                      errors.expenseName && styles.inputError,
                    ]}
                    maxLength={CONSTANTS.MAX_GROUP_NAME_LENGTH}
                    accessibilityLabel="Group name input"
                    accessibilityHint="Enter a name for your group"
                  />
                  {errors.expenseName && (
                    <Text style={styles.errorText}>{errors.expenseName}</Text>
                  )}
                </View>

                {/* Amount */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
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
                      {getCurrencySymbol(selectedGroup?.currency || "USD")}
                    </Text>
                    <TextInput
                      placeholder="0.00"
                      placeholderTextColor={darkMode ? "#888" : "#999"}
                      keyboardType="numeric"
                      value={expenseAmount}
                      onChangeText={(text) => {
                        const sanitizedAmount = sanitizeNumericInput(text);
                        if (
                          validateAmount(sanitizedAmount) ||
                          sanitizedAmount === ""
                        ) {
                          setExpenseAmount(sanitizedAmount);
                        }
                        if (errors.expenseAmount)
                          setErrors((prev) => ({
                            ...prev,
                            expenseAmount: null,
                          }));
                      }}
                      style={[
                        styles.textInput,
                        { paddingLeft: 35 },
                        darkMode && styles.darkTextInput,
                        errors.expenseAmount && styles.inputError,
                      ]}
                    />
                  </View>
                  {errors.expenseAmount && (
                    <Text style={styles.errorText}>{errors.expenseAmount}</Text>
                  )}
                </View>

                {/* Who Paid */}
                <View style={[styles.inputGroup]}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Who paid? *
                  </Text>
                  <DropDownPicker
                    placeholder="Select who paid"
                    open={payerDropdownOpen}
                    value={expensePaidBy}
                    items={groupMemberOptions}
                    setOpen={(open) => {
                      closeAllDropdowns();
                      setPayerDropdownOpen(open);
                    }}
                    setValue={setExpensePaidBy}
                    setItems={() => {}}
                    style={[
                      styles.dropdown,
                      darkMode && styles.darkDropdown,
                      errors.expensePaidBy && styles.inputError,
                    ]}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      darkMode && styles.darkDropdownContainer,
                    ]}
                    textStyle={[
                      styles.dropdownText,
                      darkMode && styles.darkText,
                    ]}
                    placeholderStyle={[
                      styles.dropdownPlaceholder,
                      darkMode && styles.darkSubtext,
                    ]}
                    arrowIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    tickIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    searchable
                    searchPlaceholder="Search members..."
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      keyboardShouldPersistTaps: "handled",
                      nestedScrollEnabled: true,
                      showsVerticalScrollIndicator: true,
                      bounces: true,
                      decelerationRate: "fast",
                    }}
                    maxHeight={280}
                    dropDownDirection="BOTTOM"
                    zIndex={2000}
                  />
                  {errors.expensePaidBy && (
                    <Text style={styles.errorText}>{errors.expensePaidBy}</Text>
                  )}
                </View>

                {/* Split With */}
                <View style={[styles.inputGroup]}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Split with who? *
                  </Text>
                  <DropDownPicker
                    multiple
                    min={1}
                    placeholder="Select people to split with"
                    open={splitDropdownOpen}
                    value={expenseSplitWith}
                    items={groupMemberOptions}
                    setOpen={(open) => {
                      closeAllDropdowns();
                      setSplitDropdownOpen(open);
                    }}
                    setValue={setExpenseSplitWith}
                    setItems={() => {}}
                    onOpen={() => setPayerDropdownOpen(false)}
                    style={[
                      styles.dropdown,
                      darkMode && styles.darkDropdown,
                      errors.expenseSplitWith && styles.inputError,
                    ]}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      darkMode && styles.darkDropdownContainer,
                    ]}
                    textStyle={[
                      styles.dropdownText,
                      darkMode && styles.darkText,
                    ]}
                    placeholderStyle={[
                      styles.dropdownPlaceholder,
                      darkMode && styles.darkSubtext,
                    ]}
                    arrowIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    tickIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    closeIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    mode="BADGE"
                    searchable
                    searchPlaceholder="Search members..."
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      keyboardShouldPersistTaps: "handled",
                      nestedScrollEnabled: true,
                      showsVerticalScrollIndicator: true,
                      bounces: true,
                      decelerationRate: "fast",
                    }}
                    maxHeight={400}
                    dropDownDirection="TOP"
                    zIndex={1000}
                    badgeColors={
                      darkMode
                        ? [
                            "#4A5568",
                            "#2D3748",
                            "#1A202C",
                            "#2C5282",
                            "#553C9A",
                          ]
                        : [
                            "#F2C4DE",
                            "#C4F2D2",
                            "#C4D7F2",
                            "#F2EBC4",
                            "#E1C4F2",
                          ]
                    }
                    badgeDotColors={
                      darkMode
                        ? [
                            "#E2E8F0",
                            "#A0AEC0",
                            "#718096",
                            "#4299E1",
                            "#805AD5",
                          ]
                        : [
                            "#E63946",
                            "#2A9D8F",
                            "#264653",
                            "#E9C46A",
                            "#A857D4",
                          ]
                    }
                    badgeTextStyle={{ color: darkMode ? "#E2E8F0" : "#374151" }}
                  />
                  {errors.expenseSplitWith && (
                    <Text style={styles.errorText}>
                      {errors.expenseSplitWith}
                    </Text>
                  )}
                </View>

                {/* How to Split */}
                {expenseSplitWith.length > 0 && (
                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, darkMode && styles.darkText]}
                    >
                      How to split?
                    </Text>
                    <View
                      style={[
                        styles.splitTypeContainer,
                        darkMode && { backgroundColor: "#D69E2E" },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.splitTypeButton,
                          darkMode && styles.darkSplitTypeButton,
                          splitType === "equal" && styles.splitTypeButtonActive,
                          splitType === "equal" &&
                            darkMode &&
                            styles.darkSplitTypeButtonActive,
                        ]}
                        onPress={() => setSplitType("equal")}
                      >
                        <Text
                          style={[
                            styles.splitTypeButtonText,
                            darkMode && styles.darkSplitTypeButtonText,
                            splitType === "equal" &&
                              styles.splitTypeButtonTextActive,
                            splitType === "equal" &&
                              darkMode &&
                              styles.darkSplitTypeButtonTextActive,
                          ]}
                        >
                          Split Equally
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.splitTypeButton,
                          darkMode && styles.darkSplitTypeButton,
                          splitType === "custom" &&
                            styles.splitTypeButtonActive,
                          splitType === "custom" &&
                            darkMode &&
                            styles.darkSplitTypeButtonActive,
                        ]}
                        onPress={() => {
                          setSplitType("custom");
                          // Auto-populate equal amounts when switching to custom
                          if (expenseSplitWith.length > 0 && expenseAmount) {
                            const equalAmount = (
                              parseFloat(expenseAmount) /
                              expenseSplitWith.length
                            ).toFixed(2);
                            const newCustomAmounts = {};
                            expenseSplitWith.forEach((member) => {
                              newCustomAmounts[member] = equalAmount;
                            });
                            setCustomSplitAmounts(newCustomAmounts);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.splitTypeButtonText,
                            darkMode && styles.darkSplitTypeButtonText,
                            splitType === "custom" &&
                              styles.splitTypeButtonTextActive,
                            splitType === "custom" &&
                              darkMode &&
                              styles.darkSplitTypeButtonTextActive,
                          ]}
                        >
                          Custom Split
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {splitType === "custom" && (
                      <View
                        style={[
                          styles.customSplitContainer,
                          darkMode && {
                            backgroundColor: "#374151",
                            borderColor: "#4B5563",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.customSplitLabel,
                            darkMode && styles.darkText,
                          ]}
                        >
                          Enter amount for each person:
                        </Text>
                        {expenseSplitWith.map((member, index) => (
                          <View key={index} style={styles.customSplitRow}>
                            <Text
                              style={[
                                styles.customSplitMemberName,
                                darkMode && styles.darkText,
                              ]}
                            >
                              {member}
                            </Text>
                            <View style={styles.customSplitAmountContainer}>
                              <Text
                                style={[
                                  styles.customSplitCurrencySymbol,
                                  darkMode && { color: "#D69E2E" },
                                ]}
                              >
                                {getCurrencySymbol(
                                  selectedGroup?.currency || "USD"
                                )}
                              </Text>
                              <TextInput
                                placeholder="0.00"
                                placeholderTextColor={
                                  darkMode ? "#888" : "#999"
                                }
                                keyboardType="numeric"
                                value={customSplitAmounts[member] || ""}
                                onChangeText={(text) => {
                                  const sanitizedAmount =
                                    sanitizeNumericInput(text);
                                  setCustomSplitAmounts((prev) => ({
                                    ...prev,
                                    [member]: sanitizedAmount,
                                  }));
                                }}
                                style={[
                                  styles.customSplitInput,
                                  darkMode && {
                                    backgroundColor: "#374151",
                                    borderColor: "#4B5563",
                                    color: "#F9FAFB",
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        ))}
                        <Text
                          style={[
                            styles.customSplitTotal,
                            darkMode && { color: "#D69E2E" },
                          ]}
                        >
                          Total:{" "}
                          {getCurrencySymbol(selectedGroup?.currency || "USD")}
                          {Object.values(customSplitAmounts)
                            .reduce((total, amount) => {
                              return total + (parseFloat(amount) || 0);
                            }, 0)
                            .toFixed(2)}{" "}
                          /{" "}
                          {getCurrencySymbol(selectedGroup?.currency || "USD")}
                          {expenseAmount}
                        </Text>
                      </View>
                    )}
                    {errors.customSplit && (
                      <Text style={styles.errorText}>{errors.customSplit}</Text>
                    )}
                  </View>
                )}

                {/* Note */}
                <View style={[styles.inputGroup, { marginBottom: 32 }]}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Note (optional)
                  </Text>
                  <TextInput
                    placeholder="Add a note..."
                    placeholderTextColor={darkMode ? "#888" : "#999"}
                    value={expenseNote}
                    onChangeText={(text) => {
                      if (validateWordCount(text)) {
                        setExpenseNote(text);
                      }
                    }}
                    style={[
                      styles.textInput,
                      styles.noteInput,
                      darkMode && styles.darkTextInput,
                    ]}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    maxLength={200}
                  />
                  {expenseNote && (
                    <Text
                      style={[
                        styles.wordCountText,
                        darkMode && styles.darkSubtext,
                      ]}
                    >
                      {getWordCountForText(expenseNote)}/
                      {CONSTANTS.MAX_WORDS_LIMIT} words
                    </Text>
                  )}
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowAddExpense(false);
                    resetExpenseForm();
                    setShowGroupDetails(true);
                  }}
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                  ]}
                  disabled={isSubmitting}
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
                  onPress={addExpenseToGroup}
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    darkMode && styles.darkSaveButton,
                  ]}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      style={[
                        styles.saveButtonText,
                        darkMode && styles.darkSaveButtonText,
                      ]}
                    >
                      Add Expense
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Edit Expense Modal */}
        <Modal
          visible={showEditExpense}
          transparent
          animationType="slide"
          onRequestClose={() => {
            closeAllDropdowns();
            setShowEditExpense(false);
            setEditingExpense(null);
            resetExpenseForm();
            setShowGroupDetails(true);
          }}
        >
          <View
            style={[styles.modalOverlay, darkMode && styles.darkModalOverlay]}
          >
            <KeyboardAvoidingView
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text style={[styles.modalTitle, darkMode && styles.darkTitle]}>
                  Edit Expense
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowEditExpense(false);
                    setEditingExpense(null);
                    resetExpenseForm();
                    setShowGroupDetails(true);
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={darkMode ? Colors.text.primary.dark : Colors.text.primary.light}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollContainer}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {/* Expense Name */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Expense Name *
                  </Text>
                  <TextInput
                    placeholder="Enter expense name"
                    placeholderTextColor={darkMode ? "#888" : "#999"}
                    value={expenseName}
                    onChangeText={(text) => {
                      setExpenseName(text);
                      if (errors.expenseName) {
                        setErrors((prev) => ({
                          ...prev,
                          expenseName: null,
                        }));
                      }
                    }}
                    style={[
                      styles.textInput,
                      darkMode && styles.darkTextInput,
                      errors.expenseName && styles.inputError,
                    ]}
                    maxLength={CONSTANTS.MAX_GROUP_NAME_LENGTH}
                    accessibilityLabel="Group name input"
                    accessibilityHint="Enter a name for your group"
                  />
                  {errors.expenseName && (
                    <Text style={styles.errorText}>{errors.expenseName}</Text>
                  )}
                </View>

                {/* Amount */}
                <View style={styles.inputGroup}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
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
                      {getCurrencySymbol(selectedGroup?.currency || "USD")}
                    </Text>
                    <TextInput
                      placeholder="0.00"
                      placeholderTextColor={darkMode ? "#888" : "#999"}
                      keyboardType="decimal-pad"
                      value={expenseAmount}
                      onChangeText={(text) => {
                        const cleanText = text.replace(/[^0-9.]/g, "");
                        const parts = cleanText.split(".");
                        if (parts.length > 2) return;
                        if (parts[1] && parts[1].length > 2) {
                          setExpenseAmount(
                            parts[0] + "." + parts[1].substring(0, 2)
                          );
                        } else {
                          setExpenseAmount(cleanText);
                        }
                        if (errors.expenseAmount) {
                          setErrors((prev) => ({
                            ...prev,
                            expenseAmount: null,
                          }));
                        }
                      }}
                      style={[
                        styles.textInput,
                        { paddingLeft: 35 },
                        darkMode && styles.darkTextInput,
                        errors.expenseAmount && styles.inputError,
                      ]}
                      maxLength={10}
                    />
                  </View>
                  {errors.expenseAmount && (
                    <Text style={styles.errorText}>{errors.expenseAmount}</Text>
                  )}
                </View>

                {/* Who Paid */}
                <View style={[styles.inputGroup, { zIndex: 2000 }]}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Who paid? *
                  </Text>
                  <DropDownPicker
                    placeholder="Select who paid"
                    open={payerDropdownOpen}
                    value={expensePaidBy}
                    items={groupMemberOptions}
                    setOpen={setPayerDropdownOpen}
                    setValue={setExpensePaidBy}
                    setItems={() => {}}
                    onOpen={() => setSplitDropdownOpen(false)}
                    style={[
                      styles.dropdown,
                      darkMode && styles.darkDropdown,
                      errors.expensePaidBy && styles.inputError,
                    ]}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      darkMode && styles.darkDropdownContainer,
                    ]}
                    textStyle={[
                      styles.dropdownText,
                      darkMode && styles.darkText,
                    ]}
                    placeholderStyle={[
                      styles.dropdownPlaceholder,
                      darkMode && styles.darkText,
                    ]}
                    arrowIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    tickIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    searchable
                    searchPlaceholder="Search..."
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      keyboardShouldPersistTaps: "handled",
                      nestedScrollEnabled: true,
                      showsVerticalScrollIndicator: true,
                      bounces: true,
                      decelerationRate: "fast",
                    }}
                    maxHeight={280}
                    zIndex={2000}
                  />
                  {errors.expensePaidBy && (
                    <Text style={styles.errorText}>{errors.expensePaidBy}</Text>
                  )}
                </View>

                {/* Split With */}
                <View style={[styles.inputGroup, { zIndex: 1000 }]}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Split with who? *
                  </Text>
                  <DropDownPicker
                    multiple
                    min={0}
                    placeholder="Select people to split with"
                    open={splitDropdownOpen}
                    value={expenseSplitWith}
                    items={groupMemberOptions}
                    setOpen={setSplitDropdownOpen}
                    setValue={setExpenseSplitWith}
                    setItems={() => {}}
                    onOpen={() => setPayerDropdownOpen(false)}
                    style={[
                      styles.dropdown,
                      darkMode && styles.darkDropdown,
                      errors.expenseSplitWith && styles.inputError,
                    ]}
                    dropDownContainerStyle={[
                      styles.dropdownContainer,
                      darkMode && styles.darkDropdownContainer,
                    ]}
                    textStyle={[
                      styles.dropdownText,
                      darkMode && styles.darkText,
                    ]}
                    placeholderStyle={[
                      styles.dropdownPlaceholder,
                      darkMode && styles.darkText,
                    ]}
                    arrowIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    tickIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    closeIconStyle={{
                      tintColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                    mode="BADGE"
                    searchable
                    searchPlaceholder="Search..."
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      keyboardShouldPersistTaps: "handled",
                      nestedScrollEnabled: true,
                      showsVerticalScrollIndicator: true,
                      bounces: true,
                      decelerationRate: "fast",
                    }}
                    maxHeight={400}
                    dropDownDirection="TOP"
                    zIndex={1000}
                    badgeColors={
                      darkMode
                        ? ["#2C5282", "#553C9A"]
                        : [
                            "#F2C4DE",
                            "#C4F2D2",
                            "#C4D7F2",
                            "#F2EBC4",
                            "#E1C4F2",
                          ]
                    }
                    badgeDotColors={
                      darkMode
                        ? [
                            "#E2E8F0",
                            "#A0AEC0",
                            "#718096",
                            "#4299E1",
                            "#805AD5",
                          ]
                        : [
                            "#E63946",
                            "#2A9D8F",
                            "#264653",
                            "#E9C46A",
                            "#A857D4",
                          ]
                    }
                    badgeTextStyle={{ color: darkMode ? "#E2E8F0" : "#374151" }}
                  />
                  {errors.expenseSplitWith && (
                    <Text style={styles.errorText}>
                      {errors.expenseSplitWith}
                    </Text>
                  )}
                </View>

                {/* How to Split */}
                {expenseSplitWith.length > 0 && (
                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, darkMode && styles.darkText]}
                    >
                      How to split?
                    </Text>
                    <View
                      style={[
                        styles.splitTypeContainer,
                        darkMode && { backgroundColor: "#D69E2E" },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.splitTypeButton,
                          darkMode && styles.darkSplitTypeButton,
                          splitType === "equal" && styles.splitTypeButtonActive,
                          splitType === "equal" &&
                            darkMode &&
                            styles.darkSplitTypeButtonActive,
                        ]}
                        onPress={() => setSplitType("equal")}
                      >
                        <Text
                          style={[
                            styles.splitTypeButtonText,
                            darkMode && styles.darkSplitTypeButtonText,
                            splitType === "equal" &&
                              styles.splitTypeButtonTextActive,
                            splitType === "equal" &&
                              darkMode &&
                              styles.darkSplitTypeButtonTextActive,
                          ]}
                        >
                          Split Equally
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.splitTypeButton,
                          darkMode && styles.darkSplitTypeButton,
                          splitType === "custom" &&
                            styles.splitTypeButtonActive,
                          splitType === "custom" &&
                            darkMode &&
                            styles.darkSplitTypeButtonActive,
                        ]}
                        onPress={() => {
                          setSplitType("custom");
                          // Auto-populate equal amounts when switching to custom
                          if (expenseSplitWith.length > 0 && expenseAmount) {
                            const equalAmount = (
                              parseFloat(expenseAmount) /
                              expenseSplitWith.length
                            ).toFixed(2);
                            const newCustomAmounts = {};
                            expenseSplitWith.forEach((member) => {
                              newCustomAmounts[member] = equalAmount;
                            });
                            setCustomSplitAmounts(newCustomAmounts);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.splitTypeButtonText,
                            darkMode && styles.darkSplitTypeButtonText,
                            splitType === "custom" &&
                              styles.splitTypeButtonTextActive,
                            splitType === "custom" &&
                              darkMode &&
                              styles.darkSplitTypeButtonTextActive,
                          ]}
                        >
                          Custom Split
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {splitType === "custom" && (
                      <View
                        style={[
                          styles.customSplitContainer,
                          darkMode && {
                            backgroundColor: "#374151",
                            borderColor: "#4B5563",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.customSplitLabel,
                            darkMode && styles.darkText,
                          ]}
                        >
                          Enter amount for each person:
                        </Text>
                        {expenseSplitWith.map((member, index) => (
                          <View key={index} style={styles.customSplitRow}>
                            <Text
                              style={[
                                styles.customSplitMemberName,
                                darkMode && styles.darkText,
                              ]}
                            >
                              {member}
                            </Text>
                            <View style={styles.customSplitAmountContainer}>
                              <Text
                                style={[
                                  styles.customSplitCurrencySymbol,
                                  darkMode && { color: "#D69E2E" },
                                ]}
                              >
                                {getCurrencySymbol(
                                  selectedGroup?.currency || "USD"
                                )}
                              </Text>
                              <TextInput
                                placeholder="0.00"
                                placeholderTextColor={
                                  darkMode ? "#888" : "#999"
                                }
                                keyboardType="numeric"
                                value={customSplitAmounts[member] || ""}
                                onChangeText={(text) => {
                                  const sanitizedAmount =
                                    sanitizeNumericInput(text);
                                  setCustomSplitAmounts((prev) => ({
                                    ...prev,
                                    [member]: sanitizedAmount,
                                  }));
                                }}
                                style={[
                                  styles.customSplitInput,
                                  darkMode && {
                                    backgroundColor: "#374151",
                                    borderColor: "#4B5563",
                                    color: "#F9FAFB",
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        ))}
                        <Text
                          style={[
                            styles.customSplitTotal,
                            darkMode && { color: "#D69E2E" },
                          ]}
                        >
                          Total:{" "}
                          {getCurrencySymbol(selectedGroup?.currency || "USD")}
                          {Object.values(customSplitAmounts)
                            .reduce((total, amount) => {
                              return total + (parseFloat(amount) || 0);
                            }, 0)
                            .toFixed(2)}{" "}
                          /{" "}
                          {getCurrencySymbol(selectedGroup?.currency || "USD")}
                          {expenseAmount}
                        </Text>
                      </View>
                    )}
                    {errors.customSplit && (
                      <Text style={styles.errorText}>{errors.customSplit}</Text>
                    )}
                  </View>
                )}

                {/* Note */}
                <View style={[styles.inputGroup, { marginBottom: 32 }]}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Note (optional)
                  </Text>
                  <TextInput
                    placeholder="Add a note..."
                    placeholderTextColor={darkMode ? "#888" : "#999"}
                    value={expenseNote}
                    onChangeText={(text) => {
                      if (validateWordCount(text)) {
                        setExpenseNote(text);
                      }
                    }}
                    style={[
                      styles.textInput,
                      styles.noteInput,
                      darkMode && styles.darkTextInput,
                    ]}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    maxLength={200}
                  />
                  {expenseNote && (
                    <Text
                      style={[
                        styles.wordCountText,
                        darkMode && styles.darkSubtext,
                      ]}
                    >
                      {getWordCountForText(expenseNote)}/
                      {CONSTANTS.MAX_WORDS_LIMIT} words
                    </Text>
                  )}
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowEditExpense(false);
                    setEditingExpense(null);
                    resetExpenseForm();
                    setShowGroupDetails(true);
                  }}
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                  ]}
                  disabled={isSubmitting}
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
                  onPress={editExpense}
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    darkMode && styles.darkSaveButton,
                  ]}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
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

        {/* Add Members Modal */}
        <Modal
          visible={showAddMembers}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowAddMembers(false);
            setSelectedGroup(null);
          }}
        >
          <View
            style={[styles.modalOverlay, darkMode && styles.darkModalOverlay]}
          >
            <View
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                  Add Members to {selectedGroup?.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddMembers(false);
                    setSelectedGroup(null);
                  }}
                  style={styles.closeModalButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={darkMode ? Colors.text.primary.dark : Colors.text.primary.light}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollContainer}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                <Text style={[styles.inputLabel, darkMode && styles.darkText]}>
                  Select Friends to Add:
                </Text>

                {friends && friends.length > 0 ? (
                  friends
                    .filter(
                      (friend) => !selectedGroup?.members?.includes(friend.name)
                    )
                    .map((friend) => (
                      <Pressable
                        key={friend.name}
                        style={({ pressed }) => [
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            padding: 16,
                            backgroundColor: darkMode ? "#2D3748" : "#F8F9FA",
                            borderRadius: 12,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: darkMode ? "#4A5568" : "#E2E8F0",
                          },
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => {
                          // Add friend to group
                          const updatedGroups = groups.map((g) =>
                            g.id === selectedGroup.id
                              ? {
                                  ...g,
                                  members: [...(g.members || []), friend.name],
                                }
                              : g
                          );
                          saveGroups(updatedGroups);
                          Alert.alert(
                            "Success",
                            `${friend.name} added to ${selectedGroup.name}!`
                          );
                        }}
                      >
                        <Text style={{ fontSize: 24, marginRight: 12 }}>
                          {friend.emoji || "👤"}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              { fontSize: 16, fontWeight: "500" },
                              darkMode
                                ? { color: "#E2E8F0" }
                                : { color: "#374151" },
                            ]}
                          >
                            {friend.name}
                          </Text>
                        </View>
                        <Ionicons
                          name="add-circle"
                          size={24}
                          color={darkMode ? "#4CAF50" : "#388E3C"}
                        />
                      </Pressable>
                    ))
                ) : (
                  <Text
                    style={[
                      { textAlign: "center", fontSize: 16, marginTop: 20 },
                      darkMode ? { color: "#A0AEC0" } : { color: "#6B7280" },
                    ]}
                  >
                    No friends available to add or all friends are already
                    members.
                  </Text>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddMembers(false);
                    setSelectedGroup(null);
                  }}
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      darkMode && styles.darkCancelButtonText,
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Manage Members Modal */}
        <Modal
          visible={showManageMembers}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowManageMembers(false);
            setSelectedGroup(null);
          }}
        >
          <View
            style={[styles.modalOverlay, darkMode && styles.darkModalOverlay]}
          >
            <KeyboardAvoidingView
              style={[styles.modalContent, darkMode && styles.darkModalContent]}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text style={[styles.modalTitle, darkMode && styles.darkTitle]}>
                  Members - {selectedGroup?.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowManageMembers(false);
                    setSelectedGroup(null);
                  }}
                  style={styles.closeModalButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={darkMode ? Colors.text.primary.dark : Colors.text.primary.light}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollContainer}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {/* Current Members */}
                <Text style={[styles.inputLabel, darkMode && styles.darkText]}>
                  Current Members ({selectedGroup?.members?.length || 0}):
                </Text>

                {selectedGroup?.members && selectedGroup.members.length > 0 ? (
                  selectedGroup.members.map((member, index) => (
                    <View
                      key={`member-${index}-${
                        typeof member === "string"
                          ? member
                          : member?.name || "unknown"
                      }`}
                      style={[
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 8,
                          backgroundColor: darkMode ? "#1A202C" : "#F1F5F9",
                          borderRadius: 12,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: darkMode ? "#2D3748" : "#E2E8F0",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 24, marginRight: 12 }}>
                        {(() => {
                          const memberName =
                            typeof member === "string"
                              ? member
                              : member?.name || "";
                          const cleanMemberName = memberName.trim();
                          // Find friend emoji, or use profile emoji for "You"
                          if (cleanMemberName === you) {
                            return profileEmoji || "👤";
                          }
                          const friend = friends?.find(
                            (f) => f.name === cleanMemberName
                          );
                          return friend?.emoji || "👤";
                        })()}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            { fontSize: 16, fontWeight: "500" },
                            darkMode
                              ? { color: "#E2E8F0" }
                              : { color: "#374151" },
                          ]}
                        >
                          {(() => {
                            const memberName =
                              typeof member === "string"
                                ? member
                                : member?.name || "";
                            const cleanMemberName = memberName.trim();
                            if (!cleanMemberName) {
                              return "Unknown Member";
                            }
                            return cleanMemberName === you
                              ? `${cleanMemberName} (You)`
                              : cleanMemberName;
                          })()}
                        </Text>
                      </View>
                      {(() => {
                        const memberName =
                          typeof member === "string"
                            ? member
                            : member?.name || "";
                        const cleanMemberName = memberName.trim();

                        // Always render something for consistent spacing
                        if (cleanMemberName) {
                          // Show remove button for all members (including profile user)
                          return (
                            <Pressable
                              style={({ pressed }) => [
                                {
                                  padding: 8,
                                },
                                pressed && { opacity: 0.7 },
                              ]}
                              onPress={() => {
                                // Check if member has unsettled balances
                                const hasUnsettledBalances =
                                  selectedGroup.bills?.some((bill) => {
                                    const billPayer = bill.payer;
                                    const billSplitWith = bill.splitWith || [];

                                    // Check if this member is involved in any bill
                                    return (
                                      billPayer === cleanMemberName ||
                                      billSplitWith.includes(cleanMemberName)
                                    );
                                  });

                                if (hasUnsettledBalances) {
                                  Alert.alert(
                                    "Cannot Remove Member",
                                    `${
                                      cleanMemberName || "This member"
                                    } has unsettled balances in group expenses. Please settle all balances before removing them from the group.`,
                                    [{ text: "OK", style: "default" }]
                                  );
                                  return;
                                }

                                Alert.alert(
                                  "Remove Member",
                                  `Remove ${
                                    cleanMemberName || "Unknown Member"
                                  } from ${selectedGroup.name}?`,
                                  [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                      text: "Remove",
                                      style: "destructive",
                                      onPress: () => {
                                        const updatedGroups = groups.map((g) =>
                                          g.id === selectedGroup.id
                                            ? {
                                                ...g,
                                                members:
                                                  g.members?.filter((m) => {
                                                    const mName =
                                                      typeof m === "string"
                                                        ? m
                                                        : m?.name || "";
                                                    return (
                                                      mName.trim() !==
                                                      cleanMemberName
                                                    );
                                                  }) || [],
                                              }
                                            : g
                                        );
                                        saveGroups(updatedGroups);
                                        setSelectedGroup({
                                          ...selectedGroup,
                                          members: selectedGroup.members.filter(
                                            (m) => {
                                              const mName =
                                                typeof m === "string"
                                                  ? m
                                                  : m?.name || "";
                                              return (
                                                mName.trim() !== cleanMemberName
                                              );
                                            }
                                          ),
                                        });
                                        Alert.alert(
                                          "Success",
                                          `${
                                            cleanMemberName || "Member"
                                          } removed from group!`
                                        );
                                      },
                                    },
                                  ]
                                );
                              }}
                            >
                              <Ionicons
                                name="remove-circle-outline"
                                size={28}
                                color="#D32F2F"
                              />
                            </Pressable>
                          );
                        } else {
                          // Show invisible placeholder for profile user to maintain consistent spacing
                          return (
                            <View
                              style={{
                                padding: 8,
                                width: 44, // Same width as the remove button (28 + 8+8 padding)
                                height: 44, // Same height as the remove button
                              }}
                            />
                          );
                        }
                      })()}
                    </View>
                  ))
                ) : (
                  <Text
                    style={[
                      { textAlign: "center", fontSize: 16, marginVertical: 20 },
                      darkMode ? { color: "#A0AEC0" } : { color: "#6B7280" },
                    ]}
                  >
                    No members in this group yet.
                  </Text>
                )}

                {/* Add More Members Section */}
                <View style={{ marginTop: 24 }}>
                  <Text
                    style={[styles.inputLabel, darkMode && styles.darkText]}
                  >
                    Add More Members:
                  </Text>

                  {(() => {
                    const availableMembers = [];

                    // Add profile user if not already in group
                    const isProfileUserInGroup = selectedGroup?.members?.some(
                      (member) => {
                        const memberName =
                          typeof member === "string"
                            ? member
                            : member?.name || "";
                        return memberName === you;
                      }
                    );

                    if (!isProfileUserInGroup) {
                      availableMembers.push({
                        name: you,
                        emoji: profileEmoji,
                        isProfileUser: true,
                      });
                    }

                    // Add friends not in group
                    if (friends && friends.length > 0) {
                      friends.forEach((friend) => {
                        if (!selectedGroup?.members) {
                          availableMembers.push(friend);
                        } else {
                          const isFriendInGroup = selectedGroup.members.some(
                            (member) => {
                              const memberName =
                                typeof member === "string"
                                  ? member
                                  : member?.name || "";
                              return memberName === friend.name;
                            }
                          );
                          if (!isFriendInGroup) {
                            availableMembers.push(friend);
                          }
                        }
                      });
                    }

                    return availableMembers.length > 0 ? (
                      availableMembers.map((friend, index) => (
                        <Pressable
                          key={`add-friend-${index}-${friend.name}`}
                          style={({ pressed }) => [
                            {
                              flexDirection: "row",
                              alignItems: "center",
                              padding: 16,
                              backgroundColor: darkMode ? "#1A202C" : "#F1F5F9",
                              borderRadius: 12,
                              marginBottom: 8,
                              borderWidth: 1,
                              borderColor: darkMode ? "#2D3748" : "#E2E8F0",
                            },
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => {
                            const updatedGroups = groups.map((g) =>
                              g.id === selectedGroup.id
                                ? {
                                    ...g,
                                    members: [
                                      ...(g.members || []),
                                      friend.name,
                                    ],
                                  }
                                : g
                            );
                            saveGroups(updatedGroups);
                            setSelectedGroup({
                              ...selectedGroup,
                              members: [
                                ...(selectedGroup.members || []),
                                friend.name,
                              ],
                            });
                            Alert.alert(
                              "Success",
                              `${friend.name} added to ${selectedGroup.name}!`
                            );
                          }}
                        >
                          <Text style={{ fontSize: 24, marginRight: 12 }}>
                            {friend.emoji || "👤"}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                { fontSize: 16, fontWeight: "500" },
                                darkMode
                                  ? { color: "#E2E8F0" }
                                  : { color: "#374151" },
                              ]}
                            >
                              {friend.isProfileUser
                                ? `${friend.name} (You)`
                                : friend.name}
                            </Text>
                          </View>
                          <Ionicons
                            name="add-circle-outline"
                            size={28}
                            color={darkMode ? "#4CAF50" : "#388E3C"}
                          />
                        </Pressable>
                      ))
                    ) : (
                      <Text
                        style={[
                          { textAlign: "center", fontSize: 16, marginTop: 20 },
                          darkMode
                            ? { color: "#A0AEC0" }
                            : { color: "#6B7280" },
                        ]}
                      >
                        {friends?.length === 0
                          ? "No friends available to add."
                          : "All friends are already members."}
                      </Text>
                    );
                  })()}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    setShowManageMembers(false);
                    setSelectedGroup(null);
                  }}
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    darkMode && styles.darkCancelButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      darkMode && styles.darkCancelButtonText,
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    color: "#8B4513", // Brown theme
    marginBottom: 6,
  },
  darkTitle: {
    color: "#D69E2E", // Gold in dark mode
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  darkText: {
    color: "#F7FAFC",
  },
  darkSubtext: {
    color: "#CBD5E0",
  },
  darkAmount: {
    color: "#F6E05E",
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
  // Dropdown search input (smaller, matches HistoryScreen)
  searchTextInput: {
    color: "#374151",
  },
  darkSearchTextInput: {
    color: "#FFFFFF",
  },
  clearSearch: {
    padding: 4,
  },

  // Add Button
  addButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B4513",
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  darkAddGroupButton: {
    backgroundColor: "#D69E2E",
    shadowColor: "#D69E2E",
  },
  darkSaveButton: {
    backgroundColor: "#D69E2E",
  },
  addGroupButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  addGroupButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
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
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  clearFiltersButton: {
    backgroundColor: "#8B4513", // Brown theme
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  darkClearFiltersButton: {
    backgroundColor: "#D69E2E", // Gold for dark mode
  },
  clearFiltersText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
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
    paddingTop: 4,
    paddingBottom: 20, // Will be overridden with navigationSpacing
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  itemSeparator: {
    height: 16,
  },

  // Group Card
  groupCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkGroupCard: {
    backgroundColor: "#2D3748",
  },
  groupCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  groupCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  groupMainInfo: {
    flex: 1,
    marginRight: 16,
  },
  groupDateContainer: {
    alignItems: "flex-end",
  },
  groupDate: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "right",
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  groupBalance: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B4513",
  },
  darkGroupBalance: {
    color: "#D69E2E",
  },
  groupDetails: {
    gap: 8,
  },
  groupStatsColumn: {
    gap: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginLeft: "auto",
  },

  // Action Buttons Container
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    minHeight: 36,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Members Button - Professional Green Theme
  membersButton: {
    backgroundColor: "#F1F8E9",
    borderColor: "#C8E6C9",
  },
  darkMembersButton: {
    backgroundColor: "#2D4A34",
    borderColor: "#4CAF50",
  },
  membersButtonText: {
    color: "#388E3C",
  },

  // Edit Button
  editButton: {
    backgroundColor: "#F8F4E8",
    borderColor: "#D4A574",
  },
  darkEditButton: {
    backgroundColor: "#3D3D3D",
    borderColor: "#D69E2E",
  },
  editButtonText: {
    color: "#8B4513",
  },
  darkEditButtonText: {
    color: "#D69E2E",
  },

  // Delete Button
  deleteButton: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
  },
  darkDeleteButton: {
    backgroundColor: "#4A2C2C",
    borderColor: "#F44336",
  },
  deleteButtonText: {
    color: "#D32F2F",
  },
  darkDeleteButtonText: {
    color: "#EF5350",
  },
  recentExpensePreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    marginTop: 4,
  },
  darkRecentExpensePreview: {
    backgroundColor: "#2D3748",
  },
  recentExpenseLabel: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },
  recentExpenseAmount: {
    fontSize: 12,
    color: "#8B4513",
    fontWeight: "600",
  },
  groupDescription: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
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
    marginBottom: 2,
  },
  clearSearchButton: {
    backgroundColor: "#8B4513", // Brown theme
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  darkClearSearchButton: {
    backgroundColor: "#D69E2E", // Gold for dark mode
  },
  clearSearchText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  darkModalOverlay: {
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContent: {
    backgroundColor: "#FEFEFE",
    borderRadius: 20,
    width: "100%",
    maxHeight: "95%", // Increased from 85% to 95% to allow more space for dropdown
    minHeight: "75%", // Increased from 60% to 75% for better dropdown space
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  darkModalContent: {
    backgroundColor: "#2D3748",
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
  darkModalHeader: {
    borderBottomColor: "#4A5568",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B4513",
    flex: 1,
  },
  darkTitle: {
    color: "#D69E2E",
  },
  modalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addExpenseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F8FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  darkAddExpenseButton: {
    backgroundColor: "rgba(214, 158, 46, 0.2)",
  },
  addExpenseButtonText: {
    color: "#8B4513",
    fontSize: 14,
    fontWeight: "600",
  },
  darkAddExpenseButtonText: {
    color: "#D69E2E",
  },
  closeModalButton: {
    padding: 4,
  },
  modalScrollContainer: {
    flex: 1,
    padding: 24,
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 35,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
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
    color: "#E2E8F0",
  },
  noteInput: {
    height: 80,
    textAlignVertical: "top",
  },
  amountContainer: {
    position: "relative",
  },
  currencySymbol: {
    position: "absolute",
    left: 16,
    top: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513",
    zIndex: 1,
  },
  darkCurrencySymbol: {
    color: "#D69E2E",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    minHeight: 54,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  darkDropdownContainer: {
    backgroundColor: "#1A202C",
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
  itemSeparator: {
    backgroundColor: "#F3F4F6",
    height: 1,
    marginHorizontal: 10,
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
  noFriendsContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  noFriendsText: {
    color: "#F57F17",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Modal Actions
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  darkModalActions: {
    borderTopColor: "#4A5568",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  darkCancelButton: {
    backgroundColor: "#374151",
    borderColor: "#6B7280",
  },
  saveButton: {
    backgroundColor: "#8B4513",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  darkCancelButtonText: {
    color: "#E5E7EB",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  darkSaveButtonText: {
    color: "#fff",
  },

  // Group Details
  groupInfoSection: {
    marginBottom: 24,
  },
  groupInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  darkGroupInfoCard: {
    backgroundColor: "#1A202C",
  },
  groupInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  groupInfoLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  groupInfoValue: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2356A8",
  },
  descriptionCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
  },
  darkDescriptionCard: {
    backgroundColor: "#1A202C",
  },
  descriptionText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    lineHeight: 20,
  },

  // Sections
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },

  // Members
  membersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  memberChip: {
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  darkMemberChip: {
    backgroundColor: "#1A202C",
  },
  memberName: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "500",
  },

  // Member Circles for Group Cards
  memberCirclesContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  memberCirclesLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "500",
  },
  memberCircles: {
    flexDirection: "row",
    gap: 6,
  },
  memberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  darkMemberCircle: {
    backgroundColor: "#2D3748",
    borderColor: "#4A5568",
  },
  moreCircle: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  memberInitials: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1976D2",
  },

  // Member Avatars for Group Details Modal
  memberAvatarsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  darkMemberAvatar: {
    backgroundColor: "#2D3748",
    borderColor: "#4A5568",
  },
  moreAvatar: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976D2",
  },

  // Expenses
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    backgroundColor: "#2D3748",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: Spacing.lg,
    borderWidth: 0,
  },
  darkExpenseItem: {
    backgroundColor: "#2D3748",
    shadowOpacity: 0.4,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  expenseName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F7FAFC",
    flex: 1,
    marginRight: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F6E05E",
    marginBottom: Spacing.xs,
  },
  expenseDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  expenseDetail: {
    fontSize: 15,
    fontWeight: "500",
    color: "#CBD5E0",
  },
  expenseDateContainer: {
    alignItems: "flex-end",
  },
  expenseDate: {
    fontSize: 15,
    fontWeight: "600",
    color: "#CBD5E0",
    textAlign: "right",
  },
  expenseNote: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary.light,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  billDetails: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  billDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  billDetailText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#CBD5E0",
    flex: 1,
  },
  splitTypeIndicator: {
    fontSize: 13,
    fontWeight: "500",
    color: "#A0AEC0",
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  moreExpensesText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 8,
  },

  // Enhanced Expense Styles
  splitDetails: {
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  darkSplitDetails: {
    backgroundColor: "#1A202C",
  },
  splitTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },
  splitList: {
    gap: 4,
  },
  splitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  splitPerson: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  owesAmount: {
    fontSize: 12,
    fontWeight: "500",
  },
  expenseActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    justifyContent: "flex-end",
  },
  expenseActionButton: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    minHeight: 40,
    flex: 1,
    maxWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editExpenseText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  deleteExpenseText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    color: Colors.delete.text.light,
    fontWeight: "600",
  },
  // Dark mode button styles
  darkExpenseActions: {
    borderTopColor: Colors.gray600,
  },
  darkEditExpenseButton: {
    backgroundColor: Colors.edit.background.dark,
    borderColor: Colors.edit.border.dark,
  },
  darkDeleteExpenseButton: {
    backgroundColor: Colors.delete.background.dark,
    borderColor: Colors.delete.border.dark,
  },
  darkEditExpenseText: {
    color: Colors.edit.text.dark,
  },
  darkDeleteExpenseText: {
    color: Colors.delete.text.dark,
  },
  wordCountText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    marginLeft: 4,
    fontStyle: "italic",
  },

  // Split type styles
  splitTypeContainer: {
    flexDirection: "row",
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  darkSplitTypeButton: {
    backgroundColor: "#374151",
    borderColor: "#4B5563",
  },
  splitTypeButtonActive: {
    backgroundColor: "#8B4513",
    borderColor: "#8B4513",
  },
  darkSplitTypeButtonActive: {
    backgroundColor: "#D69E2E",
    borderColor: "#D69E2E",
  },
  splitTypeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  darkSplitTypeButtonText: {
    color: "#D1D5DB",
  },
  splitTypeButtonTextActive: {
    color: "#FFFFFF",
  },
  darkSplitTypeButtonTextActive: {
    color: "#1F2937",
  },

  // Custom split styles
  customSplitContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  customSplitLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  customSplitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  customSplitMemberName: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  customSplitAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
  },
  customSplitCurrencySymbol: {
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
  },
  customSplitTotal: {
    fontSize: 12,
    color: "#8B4513",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
});

// PropTypes for GroupsScreen component
GroupsScreen.propTypes = {
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      emoji: PropTypes.string,
    })
  ).isRequired,
  profileName: PropTypes.string.isRequired,
  profileEmoji: PropTypes.string,
  darkMode: PropTypes.bool,
  addBill: PropTypes.func,
  editBill: PropTypes.func,
  deleteBill: PropTypes.func,
};

GroupsScreen.defaultProps = {
  darkMode: false,
  addBill: null,
  editBill: null,
  deleteBill: null,
};

// Export wrapped component with Error Boundary
export default function WrappedGroupsScreen(props) {
  return (
    <GroupsErrorBoundary>
      <GroupsScreen {...props} />
    </GroupsErrorBoundary>
  );
}
