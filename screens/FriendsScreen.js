import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  Share,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enhanced Friend Item Component with improved status indicator
const FriendItem = React.memo(
  ({
    item,
    navigation,
    onEdit,
    onDelete,
    onInvite,
    animatedValue,
    balance,
    lastActivity,
    darkMode = false,
    profileName,
    isDeletingFriend, // Add loading state prop
  }) => {
    const getBalanceText = (balance, name) => {
      if (Math.abs(balance) < 0.01) return "All settled up"; // Better than "No pending balances"
      if (balance > 0)
        return `${name || "Friend"} owes ${profileName} $${Math.abs(
          balance
        ).toFixed(2)}`;
      return `${profileName} owes ${name || "Friend"} $${Math.abs(
        balance
      ).toFixed(2)}`;
    };

    const getBalanceColor = (balance) => {
      if (balance > 0) return "#4CAF50"; // Green: they owe you
      if (balance < 0) return "#F44336"; // Red: you owe them
      return darkMode ? "#9CA3AF" : "#757575"; // Gray: settled - adjusted for dark mode
    };

    // Enhanced avatar border color logic
    const getAvatarBorderColor = (balance) => {
      if (Math.abs(balance) < 0.01) return "#4CAF50"; // Green for settled
      if (balance > 0) return "#2196F3"; // Blue for they owe you
      if (balance < 0) return "#FF9800"; // Orange for you owe them
      return darkMode ? "#4A5568" : "#e0e0e0"; // Default border
    };

    // Get online status (you can replace this with actual online status logic)
    const getOnlineStatus = () => {
      // For now, showing all friends as online for demonstration
      // In a real app, you'd check actual online status
      return true; // or check item.isOnline, item.lastSeen, etc.
    };

    const getStatusColor = () => {
      return getOnlineStatus() ? "#4CAF50" : "#9E9E9E"; // Green for online, gray for offline
    };

    const getStatusText = () => {
      return getOnlineStatus() ? "Online" : "Offline";
    };

    return (
      <Animated.View
        style={{
          backgroundColor: darkMode ? "#2D3748" : "#FFFFFF",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          marginHorizontal: 4,
          borderColor: darkMode ? "#4A5568" : "#e0e0e0",
          borderWidth: 1,
          shadowColor: darkMode ? "#000000" : "#000000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: darkMode ? 0.4 : 0.1,
          shadowRadius: 12,
          elevation: 6,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              }),
            },
          ],
        }}
      >
        <Pressable
          onPress={() =>
            navigation.navigate("FriendDetail", { friendName: item.name })
          }
          style={{ marginBottom: 20 }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {/* Avatar with Status Indicator */}
            <View style={{ position: "relative", marginRight: 20 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: darkMode ? "#4A5568" : "#EFE4D2",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 3,
                  borderColor: getAvatarBorderColor(balance),
                }}
              >
                <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
              </View>

              {/* Status Indicator - Top Right Corner */}
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 20, // Increased size from 16 to 20
                  height: 20, // Increased size from 16 to 20
                  borderRadius: 10, // Half of width/height for perfect circle
                  backgroundColor: getStatusColor(),
                  borderWidth: 3, // Increased border for better visibility
                  borderColor: darkMode ? "#2D3748" : "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 3,
                }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color: darkMode ? "#E2E8F0" : "#2D3748",
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                {/* Online/Offline Status Text */}
                <Text
                  style={{
                    fontSize: 13,
                    color: getStatusColor(),
                    fontWeight: "600",
                    marginLeft: 8,
                  }}
                >
                  {getStatusText()}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 16,
                  color: getBalanceColor(balance),
                  fontWeight: "500",
                  marginBottom: 8,
                  lineHeight: 22,
                }}
              >
                {getBalanceText(balance, item.name)}
              </Text>

              {lastActivity && (
                <Text
                  style={{
                    fontSize: 13,
                    color: darkMode ? "#A0AEC0" : "#718096",
                    marginBottom: 4,
                  }}
                >
                  Last activity: {lastActivity}
                </Text>
              )}
            </View>
          </View>
        </Pressable>

        {/* Action Buttons */}
        <View style={styles.friendActions}>
          {/* Invite Button */}
          <Pressable
            onPress={() => onInvite(item)}
            style={({ pressed }) => [
              styles.actionButton,
              styles.inviteButton,
              darkMode && styles.darkInviteButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.inviteButtonText,
                darkMode && styles.darkInviteButtonText,
              ]}
            >
              Invite
            </Text>
          </Pressable>

          {/* Edit Button */}
          <Pressable
            onPress={() => onEdit(item.name)}
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

          {/* Delete Button with loading state */}
          <Pressable
            onPress={() => onDelete(item.name)}
            disabled={isDeletingFriend === item.name}
            style={({ pressed }) => [
              styles.actionButton,
              styles.deleteButton,
              darkMode && styles.darkDeleteButton,
              pressed && styles.actionButtonPressed,
              isDeletingFriend === item.name && { opacity: 0.5 },
            ]}
          >
            {isDeletingFriend === item.name ? (
              <ActivityIndicator
                size="small"
                color={darkMode ? "#EF5350" : "#D32F2F"}
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
      </Animated.View>
    );
  }
);

const FriendsScreen = ({
  friends,
  setFriends,
  syncFriends,
  navigation,
  bills,
  profileName,
  profileEmoji,
  setProfileEmoji,
  darkMode = false,
  currentUser, // Add current user context
}) => {
  const insets = useSafeAreaInsets();
  const navigationSpacing = Math.max(insets.bottom, 20) + 10 + 30; // Navigation bar spacing

  const [friend, setFriend] = useState("");
  const [emoji, setEmoji] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingFriend, setIsDeletingFriend] = useState(null); // Track which friend is being deleted
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [allSettlements, setAllSettlements] = useState({}); // Store settlements for all friends
  const [isCalculatingBalances, setIsCalculatingBalances] = useState(false);

  // Animation for list items
  const animatedValue = useState(new Animated.Value(0))[0];

  // Theme colors object for consistent theming
  const theme = useMemo(
    () => ({
      background: darkMode ? "#1A202C" : "#EFE4D2",
      cardBackground: darkMode ? "#2D3748" : "#FFFFFF",
      inputBackground: darkMode ? "#1A202C" : "#F7FAFC",
      textPrimary: darkMode ? "#E2E8F0" : "#2D3748",
      textSecondary: darkMode ? "#A0AEC0" : "#718096",
      textTertiary: darkMode ? "#718096" : "#A0AEC0",
      border: darkMode ? "#4A5568" : "#E2E8F0",
      primary: darkMode ? "#D69E2E" : "#8B4513",
      primaryPressed: darkMode ? "#B7791F" : "#6B3409",
      placeholder: darkMode ? "#A0AEC0" : "#A0ADB8",
    }),
    [darkMode]
  );

  // Calculate balances for each friend (from profile user's perspective)
  // Positive balance = friend owes current user
  // Negative balance = current user owes friend
  const friendBalances = useMemo(() => {
    setIsCalculatingBalances(true);
    const balances = {};
    const currentUser = profileName?.trim();

    // Ensure we have a valid profile name
    if (!currentUser) {
      return {};
    }

    // Initialize all friends with 0 balance
    friends.forEach((friend) => {
      balances[friend.name] = 0;
    });

    // Process each bill
    bills.forEach((bill) => {
      const amount = parseFloat(bill.amount || 0);
      const splitWith = bill.splitWith || [];
      const payer = bill.payer;
      const splitType = bill.splitType || "equal";
      const splitAmounts = bill.splitAmounts || {};

      if (amount <= 0 || splitWith.length === 0) return; // Skip invalid bills

      // Only process bills where the current user is involved
      if (!splitWith.includes(currentUser) && payer !== currentUser) {
        return;
      }

      // Calculate individual amounts based on split type
      let individualAmounts = {};

      if (splitType === "exact" && splitAmounts) {
        individualAmounts = splitAmounts;
      } else if (splitType === "percentage" && splitAmounts) {
        splitWith.forEach((person) => {
          const percentage = splitAmounts[person] || 0;
          individualAmounts[person] = (amount * percentage) / 100;
        });
      } else {
        // Equal split (default)
        const perPersonAmount = amount / splitWith.length;
        splitWith.forEach((person) => {
          individualAmounts[person] = perPersonAmount;
        });
      }

      if (payer === currentUser) {
        // Current user paid the bill - friends owe the current user
        splitWith.forEach((person) => {
          if (person !== currentUser && balances.hasOwnProperty(person)) {
            balances[person] += individualAmounts[person] || 0; // Friend owes current user
          }
        });
      } else if (
        balances.hasOwnProperty(payer) &&
        splitWith.includes(currentUser)
      ) {
        // A friend paid the bill, and current user is in the split
        // Current user owes the payer friend
        balances[payer] -= individualAmounts[currentUser] || 0; // Current user owes the friend (negative = user owes friend)
      }
    });

    // Calculate the total bill-based balance (without settlements)
    const billBasedBalances = { ...balances };

    // Apply settlements to adjust balances - only if there are bills involving both users
    friends.forEach((friend) => {
      const friendSettlements = allSettlements[friend.name] || [];

      // Check if there are any bills involving this friend and current user
      const hasValidBillsWithFriend = bills.some((bill) => {
        const isCurrentUserInvolved =
          bill.payer === currentUser ||
          (bill.splitWith && bill.splitWith.includes(currentUser));
        const isFriendInvolved =
          bill.payer === friend.name ||
          (bill.splitWith && bill.splitWith.includes(friend.name));
        return isCurrentUserInvolved && isFriendInvolved;
      });

      // Only apply settlements if there are valid bills between users
      if (!hasValidBillsWithFriend) {
        // Reset balance to 0 if no bills exist between users - ignore settlements
        balances[friend.name] = 0;
        return;
      }

      // Start with the bill-based balance
      let currentBalance = billBasedBalances[friend.name];

      // Only apply settlements that were made AFTER bills exist between users
      // This prevents old settlements from affecting new bill calculations
      const billDates = bills
        .filter((bill) => {
          const isCurrentUserInvolved =
            bill.payer === currentUser ||
            (bill.splitWith && bill.splitWith.includes(currentUser));
          const isFriendInvolved =
            bill.payer === friend.name ||
            (bill.splitWith && bill.splitWith.includes(friend.name));
          return isCurrentUserInvolved && isFriendInvolved;
        })
        .map((bill) => new Date(bill.date || 0));

      const firstBillDate =
        billDates.length > 0 ? Math.min(...billDates) : new Date();

      // Filter settlements to only include those after bills started
      const validSettlements = friendSettlements.filter((settlement) => {
        const settlementDate = new Date(settlement.date);
        return settlementDate >= firstBillDate;
      });

      // Sort settlements by date to apply them chronologically
      const sortedSettlements = validSettlements.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      sortedSettlements.forEach((settlement) => {
        const settleAmount =
          Math.round(parseFloat(settlement.amount) * 100) / 100;
        const direction = settlement.direction;

        // Apply settlement to current balance
        // Positive balance = friend owes user, Negative balance = user owes friend
        let friendOwesUser = currentBalance > 0 ? currentBalance : 0;
        let userOwesFriend = currentBalance < 0 ? Math.abs(currentBalance) : 0;

        if (
          direction === "user_to_friend" ||
          (!direction && settlement.payerName === currentUser)
        ) {
          // Current user paid the friend, so reduce what user owes friend
          if (userOwesFriend >= settleAmount) {
            userOwesFriend -= settleAmount;
          } else {
            // If settlement is more than owed, friend now owes user the difference
            const remaining = settleAmount - userOwesFriend;
            userOwesFriend = 0;
            friendOwesUser += remaining;
          }
        } else if (
          direction === "friend_to_user" ||
          (!direction && settlement.payerName === friend.name)
        ) {
          // Friend paid the user, so reduce what friend owes user
          if (friendOwesUser >= settleAmount) {
            friendOwesUser -= settleAmount;
          } else {
            // If settlement is more than owed, user now owes friend the difference
            const remaining = settleAmount - friendOwesUser;
            friendOwesUser = 0;
            userOwesFriend += remaining;
          }
        }

        // Update current balance for next settlement
        if (friendOwesUser > userOwesFriend) {
          currentBalance = friendOwesUser - userOwesFriend;
        } else {
          currentBalance = -(userOwesFriend - friendOwesUser);
        }
      });

      // Set the final balance after all settlements and round to avoid floating-point precision errors
      const roundedBalance = Math.round(currentBalance * 100) / 100;
      balances[friend.name] = roundedBalance;
    });

    // Use setTimeout to set loading to false after calculation completes
    setTimeout(() => setIsCalculatingBalances(false), 0);

    return balances;
  }, [friends, bills, profileName, allSettlements]);

  // Enhanced filtered and sorted friends
  const processedFriends = useMemo(() => {
    let filtered = [...friends];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (friend) =>
          friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (friend.email &&
            friend.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (filterBy !== "all") {
      filtered = filtered.filter((friend) => {
        const balance = friendBalances[friend.name] || 0;
        switch (filterBy) {
          case "settled":
            return Math.abs(balance) < 0.01;
          case "owes":
            return Math.abs(balance) >= 0.01;
          case "active":
            return true; // For testing - show all friends as active
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "balance":
          const balanceA = friendBalances[a.name] || 0;
          const balanceB = friendBalances[b.name] || 0;
          return Math.abs(balanceB) - Math.abs(balanceA);
        case "activity":
          return (b.lastActivity || 0) - (a.lastActivity || 0);
        default:
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
    });

    return filtered;
  }, [friends, searchQuery, filterBy, sortBy, friendBalances]);

  // Save profile emoji
  const saveProfileEmoji = useCallback(
    async (newEmoji) => {
      try {
        // Update the global state immediately
        setProfileEmoji(newEmoji);

        // The global App.js useEffect will handle saving to AsyncStorage
      } catch (error) {
        console.error("Failed to save profile emoji:", error);
      }
    },
    [setProfileEmoji]
  );

  // Load friends with better error handling - now user-scoped
  const loadFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use profileName as user identifier since we don't have full auth system
      const userId = currentUser?.id || profileName?.trim() || "default_user";
      if (userId) {
        const saved = await AsyncStorage.getItem(`friends_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          const normalized = parsed.map((f) => ({
            name: f.name,
            emoji: f.emoji || "👤",
            email: f.email || "",
            phone: f.phone || "",
            status: f.status || "active",
            lastActivity: f.lastActivity || null,
            id: f.id || `friend-${Date.now()}-${Math.random()}`,
          }));
          setFriends(normalized);
        }
      }
    } catch (err) {
      console.error("Failed to load friends", err);
      Alert.alert("Error", "Failed to load friends. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [setFriends, currentUser]);

  // Save friends with debouncing - now user-scoped
  const saveFriends = useCallback(
    async (friendsToSave) => {
      try {
        const userId = currentUser?.id || profileName?.trim() || "default_user";
        if (userId && userId !== "default_user") {
          await AsyncStorage.setItem(
            `friends_${userId}`,
            JSON.stringify(friendsToSave)
          );
        }
      } catch (err) {
        console.error("Failed to save friends", err);
        Alert.alert("Error", "Failed to save changes.");
      }
    },
    [currentUser]
  );

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    if (friends.length > 0) {
      saveFriends(friends);
      // Sync with App.js state
      if (syncFriends) {
        syncFriends(friends);
      }
    }
  }, [friends, saveFriends, syncFriends]);

  // Load settlements for all friends - extracted to separate function
  const loadAllSettlements = useCallback(async () => {
    const currentUser = profileName?.trim();
    if (!currentUser) return;

    const settlementsData = {};

    for (const friend of friends) {
      try {
        // Use the same consistent key as in FriendDetailScreen
        const userA = currentUser < friend.name ? currentUser : friend.name;
        const userB = currentUser < friend.name ? friend.name : currentUser;
        const settlementKey = `settlements_${userA}_${userB}`;

        const saved = await AsyncStorage.getItem(settlementKey);
        if (saved) {
          const settlements = JSON.parse(saved);
          settlementsData[friend.name] = settlements;
        } else {
          settlementsData[friend.name] = [];
        }
      } catch (error) {
        console.error(`Failed to load settlements for ${friend.name}:`, error);
        settlementsData[friend.name] = [];
      }
    }

    // Always update settlements to ensure latest data
    setAllSettlements(settlementsData);
  }, [friends, profileName]);

  // Load settlements on component mount and when dependencies change
  useEffect(() => {
    loadAllSettlements();
  }, [loadAllSettlements]);

  // Reload settlements when screen comes into focus (after returning from FriendDetailScreen)
  useFocusEffect(
    useCallback(() => {
      loadAllSettlements();
    }, [loadAllSettlements])
  );

  // Simplified form validation - only check friend name
  const validateFriend = useCallback(
    (name, currentEmoji, currentEmail, currentPhone) => {
      try {
        // Enhanced sanitization for all fields
        const sanitizedName = name.replace(/[<>{}"'&]/g, "").trim();
        const sanitizedEmoji = currentEmoji.trim() || "👤";
        const sanitizedEmail = currentEmail
          .toLowerCase()
          .replace(/[<>"'&]/g, "")
          .trim();
        const sanitizedPhone = currentPhone.replace(/[^+\d\s()-]/g, "").trim();

        // Name validation only
        if (!sanitizedName) {
          return { isValid: false, message: "Please enter a friend's name." };
        }

        if (sanitizedName.length < 2) {
          return {
            isValid: false,
            message: "Name must be at least 2 characters long.",
          };
        }

        if (sanitizedName.length > 20) {
          return {
            isValid: false,
            message: "Name is too long (max 20 characters).",
          };
        }

        if (sanitizedName.toLowerCase() === (profileName || "").toLowerCase()) {
          return {
            isValid: false,
            message: "You are already included by default.",
          };
        }

        // Optional email validation
        if (sanitizedEmail) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(sanitizedEmail)) {
            return {
              isValid: false,
              message: "Please enter a valid email address.",
            };
          }
        }

        // Optional phone validation
        if (sanitizedPhone) {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          const cleanPhone = sanitizedPhone.replace(/[\s()-]/g, "");
          if (!phoneRegex.test(cleanPhone)) {
            return {
              isValid: false,
              message: "Please enter a valid phone number.",
            };
          }
        }

        // Check for duplicate names only
        const isDuplicate = friends.some((f) => {
          try {
            const nameMatch =
              f.name.toLowerCase() === sanitizedName.toLowerCase();
            return nameMatch && (!isEditing || f.name !== editingName);
          } catch (error) {
            console.error("Error checking duplicates:", error);
            return false;
          }
        });

        if (isDuplicate) {
          return {
            isValid: false,
            message: "A friend with this name already exists!",
          };
        }

        return {
          isValid: true,
          name: sanitizedName,
          emoji: sanitizedEmoji,
          email: sanitizedEmail,
          phone: sanitizedPhone,
        };
      } catch (error) {
        console.error("Validation error:", error);
        return {
          isValid: false,
          message: "Validation failed. Please check your inputs.",
        };
      }
    },
    [friends, profileName, isEditing, editingName]
  );

  const handleAddOrUpdateFriend = useCallback(async () => {
    if (isSubmitting) return;

    try {
      const validation = validateFriend(friend, emoji, email, phone);

      if (!validation.isValid) {
        Alert.alert("Invalid Input", validation.message);
        return;
      }

      setIsSubmitting(true);

      const newFriend = {
        name: validation.name,
        emoji: validation.emoji,
        email: validation.email,
        phone: validation.phone,
        lastActivity: Date.now(),
        id: isEditing
          ? friends.find((f) => f.name === editingName)?.id ||
            `friend-${Date.now()}-${Math.random()}`
          : `friend-${Date.now()}-${Math.random()}`,
      };

      if (isEditing) {
        const friendExists = friends.some((f) => f.name === editingName);
        if (!friendExists) {
          throw new Error("Friend to edit not found");
        }

        setFriends((prev) =>
          prev.map((f) => (f.name === editingName ? newFriend : f))
        );
        setIsEditing(false);
        setEditingName(null);
      } else {
        setFriends((prev) => [...prev, newFriend]);
      }

      // Reset form
      setFriend("");
      setEmoji("");
      setEmail("");
      setPhone("");
      setShowAddModal(false);

      try {
        Keyboard.dismiss();
      } catch (keyboardError) {
        console.error("Keyboard dismiss error:", keyboardError);
      }

      // Success animation with error handling
      try {
        Animated.spring(animatedValue, {
          toValue: 1,
          useNativeDriver: true,
        }).start(() => {
          animatedValue.setValue(0);
        });
      } catch (animationError) {
        console.error("Animation error:", animationError);
      }

      // Send invitation if email provided
      if (validation.email && !isEditing) {
        try {
          await handleInviteFriend(newFriend);
        } catch (inviteError) {
          console.error("Invite error:", inviteError);
          // Don't fail the entire operation if invite fails
        }
      }

      // Show success message
      Alert.alert(
        "Success",
        isEditing
          ? "Friend updated successfully!"
          : "Friend added successfully!"
      );
    } catch (error) {
      console.error("Save friend error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to save friend. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    friend,
    emoji,
    email,
    phone,
    isSubmitting,
    isEditing,
    editingName,
    friends,
    setFriends,
    validateFriend,
    animatedValue,
  ]);

  const handleInviteFriend = useCallback(
    async (friendData) => {
      try {
        if (!friendData || !friendData.name) {
          throw new Error("Invalid friend data");
        }

        const message = `Hi ${friendData.name}! ${
          profileName || "Your friend"
        } has invited you to join their expense sharing group. Download our app to start splitting bills together!`;

        if (friendData.email) {
          Alert.alert(
            "Invitation Sent",
            `An invitation has been sent to ${friendData.email}`,
            [{ text: "OK" }]
          );
        } else {
          try {
            await Share.share({
              message: message,
              title: "Join My Expense Group",
            });
          } catch (shareError) {
            if (shareError.message !== "User did not share") {
              throw shareError;
            }
            // User cancelled sharing, this is normal behavior
          }
        }
      } catch (error) {
        console.error("Failed to send invitation:", error);
        Alert.alert(
          "Invitation Error",
          "Failed to send invitation. Please try again."
        );
      }
    },
    [profileName]
  );

  const handleDelete = useCallback(
    (name) => {
      try {
        if (!name || typeof name !== "string") {
          throw new Error("Invalid friend name");
        }

        const balance = friendBalances[name] || 0;

        if (Math.abs(balance) > 0.01) {
          Alert.alert(
            "Cannot Delete Friend",
            `${name} has an outstanding balance of $${Math.abs(balance).toFixed(
              2
            )}. Please settle all bills before removing them.`,
            [{ text: "OK" }]
          );
          return;
        }

        Alert.alert(
          "Delete Friend",
          `Are you sure you want to remove ${name} from your friends list?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  setIsDeletingFriend(name);

                  // Simulate async operation (would be API call in real app)
                  await new Promise((resolve) => setTimeout(resolve, 500));

                  setFriends((prev) => {
                    const filtered = prev.filter((f) => f.name !== name);
                    if (filtered.length === prev.length) {
                      throw new Error("Friend not found");
                    }
                    return filtered;
                  });

                  Alert.alert(
                    "Success",
                    `${name} has been removed from your friends list.`
                  );
                } catch (error) {
                  console.error("Delete friend error:", error);
                  Alert.alert(
                    "Error",
                    "Failed to delete friend. Please try again."
                  );
                } finally {
                  setIsDeletingFriend(null);
                }
              },
            },
          ]
        );
      } catch (error) {
        console.error("Handle delete error:", error);
        Alert.alert("Error", "Failed to process delete request.");
      }
    },
    [friendBalances, setFriends]
  );

  const handleEdit = useCallback(
    (name) => {
      try {
        if (!name || typeof name !== "string") {
          throw new Error("Invalid friend name");
        }

        const friendToEdit = friends.find((f) => f.name === name);
        if (!friendToEdit) {
          Alert.alert("Error", "Friend not found");
          return;
        }

        setIsEditing(true);
        setEditingName(name);
        setFriend(friendToEdit.name || "");
        setEmoji(friendToEdit.emoji || "👤");
        setEmail(friendToEdit.email || "");
        setPhone(friendToEdit.phone || "");
        setShowAddModal(true);
      } catch (error) {
        console.error("Handle edit error:", error);
        Alert.alert("Error", "Failed to edit friend. Please try again.");
      }
    },
    [friends]
  );

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingName(null);
    setFriend("");
    setEmoji("");
    setEmail("");
    setPhone("");
    setShowAddModal(false);
    setFormErrors({});
  }, []);

  // Simplified input handlers - only validate name
  const handleNameChange = useCallback(
    (text) => {
      try {
        const sanitized = text.replace(/[<>{}]/g, "").substring(0, 20);
        setFriend(sanitized);

        // Clear error if name becomes valid
        if (
          formErrors.name &&
          sanitized.trim().length >= 2 &&
          sanitized.trim().length <= 20
        ) {
          setFormErrors((prev) => ({ ...prev, name: null }));
        }
      } catch (error) {
        console.error("Name input error:", error);
      }
    },
    [formErrors.name]
  );

  const renderFriendItem = useCallback(
    ({ item }) => (
      <FriendItem
        item={item}
        navigation={navigation}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onInvite={handleInviteFriend}
        animatedValue={animatedValue}
        balance={friendBalances[item.name] || 0}
        lastActivity={
          item.lastActivity
            ? new Date(item.lastActivity).toLocaleDateString()
            : null
        }
        darkMode={darkMode}
        profileName={profileName}
        isDeletingFriend={isDeletingFriend}
      />
    ),
    [
      navigation,
      handleEdit,
      handleDelete,
      handleInviteFriend,
      animatedValue,
      friendBalances,
      darkMode,
      profileName,
      isDeletingFriend,
    ]
  );

  // Summary stats calculation
  const summaryStats = useMemo(() => {
    const totalFriends = friends.length;
    const activeBalances = Object.values(friendBalances).filter(
      (b) => Math.abs(Math.round(b * 100) / 100) > 0.01
    ).length;

    let totalYouAreOwed = 0;
    let totalYouOwe = 0;

    Object.entries(friendBalances).forEach(([, balance]) => {
      // Round to avoid floating-point precision issues
      const roundedBalance = Math.round(balance * 100) / 100;
      if (roundedBalance > 0) {
        totalYouAreOwed += roundedBalance;
      } else if (roundedBalance < 0) {
        totalYouOwe += Math.abs(roundedBalance);
      }
    });

    const result = {
      totalFriends,
      activeBalances,
      totalOwed: totalYouAreOwed,
      totalOwe: totalYouOwe,
    };

    return result;
  }, [friends, friendBalances]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: theme.textSecondary,
            }}
          >
            Loading friends...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={darkMode ? "#1A202C" : "#EFE4D2"}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ padding: 20, paddingTop: 10, paddingBottom: 0 }}>
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: theme.primary,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Friends Screen
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: theme.textSecondary,
                    textAlign: "center",
                  }}
                >
                  Manage your friend connections
                </Text>
                {isCalculatingBalances && (
                  <ActivityIndicator
                    size="small"
                    color={theme.primary}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>
            </View>

            {/* Summary Cards */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: 16,
                  padding: 20,
                  flex: 0.3,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: darkMode ? 0.4 : 0.15,
                  shadowRadius: 6,
                  elevation: 5,
                  borderWidth: 1,
                  borderColor: theme.border,
                  minHeight: 100,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.primary,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: "#FFFFFF",
                    }}
                  >
                    {summaryStats.totalFriends}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.textSecondary,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Total Friends
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  if (profileName?.trim()) {
                    navigation.navigate("FriendDetail", {
                      friendName: profileName.trim(),
                    });
                  } else {
                    Alert.alert(
                      "Profile Setup Required",
                      "Please set up your profile name first."
                    );
                  }
                }}
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? darkMode
                      ? "#374151"
                      : "#f5f5f5"
                    : theme.cardBackground,
                  borderRadius: 12,
                  padding: 16,
                  flex: 0.7,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: darkMode ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: theme.border,
                })}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Pressable
                    onPress={() => setShowEmojiPicker(true)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: theme.primary,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 16,
                      borderWidth: 2,
                      borderColor: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{profileEmoji}</Text>
                  </Pressable>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: theme.primary,
                        marginBottom: 4,
                        textAlign: "left",
                      }}
                      numberOfLines={1}
                    >
                      {profileName || "Your Profile"}
                    </Text>

                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.textSecondary,
                        marginBottom: 6,
                        textAlign: "left",
                      }}
                    >
                      Tap emoji to change
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: theme.textSecondary,
                        textAlign: "left",
                        marginBottom: 2,
                      }}
                    >
                      {summaryStats.totalOwed === 0 &&
                      summaryStats.totalOwe === 0
                        ? "All settled up"
                        : `${summaryStats.activeBalances} active balance${
                            summaryStats.activeBalances !== 1 ? "s" : ""
                          }`}
                    </Text>

                    <Text
                      style={{
                        fontSize: 11,
                        color: theme.textTertiary,
                        textAlign: "left",
                        marginTop: 2,
                      }}
                    >
                      Tap to view details
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Search */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 12,
                backgroundColor: theme.cardBackground,
                marginBottom: 16,
                paddingHorizontal: 12,
              }}
            >
              <Ionicons
                name="search"
                size={20}
                color={theme.textSecondary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Search friends..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  padding: 12,
                  fontSize: 16,
                  color: theme.textPrimary,
                }}
                placeholderTextColor={theme.placeholder}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  style={{
                    padding: 4,
                    marginLeft: 8,
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              )}
            </View>

            {/* Filters and Sort Row */}
            <View style={{ flexDirection: "row", marginBottom: 16, gap: 8 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flex: 1 }}
              >
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {["all", "settled", "owes", "active"].map((filter) => {
                    const getFilterLabel = (filter) => {
                      switch (filter) {
                        case "active":
                          return "Active";
                        default:
                          return (
                            filter.charAt(0).toUpperCase() + filter.slice(1)
                          );
                      }
                    };

                    return (
                      <Pressable
                        key={filter}
                        onPress={() => setFilterBy(filter)}
                        style={({ pressed }) => ({
                          backgroundColor:
                            filterBy === filter
                              ? theme.primary
                              : pressed
                              ? darkMode
                                ? "#374151"
                                : "#f0f0f0"
                              : theme.cardBackground,
                          borderRadius: 16,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderWidth: 1,
                          borderColor:
                            filterBy === filter ? theme.primary : theme.border,
                        })}
                      >
                        <Text
                          style={{
                            color:
                              filterBy === filter
                                ? "#fff"
                                : theme.textSecondary,
                            fontSize: 12,
                            fontWeight: "500",
                          }}
                        >
                          {getFilterLabel(filter)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Sort Button */}
              <Pressable
                onPress={() => {
                  const nextSort =
                    sortBy === "name"
                      ? "balance"
                      : sortBy === "balance"
                      ? "activity"
                      : "name";
                  setSortBy(nextSort);
                }}
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? theme.primaryPressed
                    : theme.primary,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  borderWidth: 1,
                  borderColor: theme.primary,
                })}
              >
                <Ionicons name="swap-vertical" size={16} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: "500",
                  }}
                >
                  {sortBy === "name"
                    ? "Name"
                    : sortBy === "balance"
                    ? "Balance"
                    : "Activity"}
                </Text>
              </Pressable>
            </View>

            {/* Add Friend Button */}
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? theme.primaryPressed : theme.primary,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                marginBottom: 16,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                + Add Friend
              </Text>
            </Pressable>
          </View>

          {/* Friends List */}
          <FlatList
            data={processedFriends}
            keyExtractor={(item) => item.id || item.name}
            renderItem={renderFriendItem}
            contentContainerStyle={{
              padding: 20,
              paddingTop: 0,
              paddingBottom: navigationSpacing,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <View
                style={{ alignItems: "center", marginTop: 60, padding: 20 }}
              >
                <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
                <Text
                  style={{
                    textAlign: "center",
                    color: theme.textSecondary,
                    fontSize: 18,
                    fontWeight: "500",
                    marginBottom: 8,
                  }}
                >
                  {searchQuery ? "No friends found" : "No friends yet"}
                </Text>
                <Text
                  style={{
                    textAlign: "center",
                    color: theme.textTertiary,
                    fontSize: 14,
                    marginBottom: 20,
                  }}
                >
                  {searchQuery
                    ? "Try a different search term"
                    : "Add some friends to start splitting expenses!"}
                </Text>
                {!searchQuery && (
                  <Pressable
                    onPress={() => setShowAddModal(true)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed
                        ? theme.primaryPressed
                        : theme.primary,
                      borderRadius: 12,
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                    })}
                  >
                    <Text
                      style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}
                    >
                      Add Your First Friend
                    </Text>
                  </Pressable>
                )}
              </View>
            }
            showsVerticalScrollIndicator={false}
          />

          {/* Add/Edit Friend Modal */}
          <Modal
            visible={showAddModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={cancelEdit}
          >
            <SafeAreaView
              style={{
                flex: 1,
                backgroundColor: theme.background,
              }}
            >
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
              >
                <View style={{ flex: 1, padding: 20 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: theme.primary,
                      }}
                    >
                      {isEditing ? "Edit Friend" : "Add New Friend"}
                    </Text>
                    <Pressable onPress={cancelEdit}>
                      <Text
                        style={{
                          fontSize: 16,
                          color: theme.textSecondary,
                        }}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View
                      style={{
                        backgroundColor: theme.cardBackground,
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <TextInput
                        placeholder="Friend's Name *"
                        value={friend}
                        onChangeText={handleNameChange}
                        style={{
                          borderWidth: 1,
                          borderColor: formErrors.name
                            ? "#F44336"
                            : theme.border,
                          borderRadius: 12,
                          padding: 14,
                          backgroundColor: theme.inputBackground,
                          fontSize: 16,
                          color: theme.textPrimary,
                          marginBottom: formErrors.name ? 4 : 16,
                        }}
                        maxLength={50}
                        placeholderTextColor={theme.placeholder}
                        accessibilityLabel="Friend's name input"
                        accessibilityHint="Enter your friend's name"
                      />
                      {formErrors.name && (
                        <Text
                          style={{
                            color: "#F44336",
                            fontSize: 12,
                            marginBottom: 12,
                            marginLeft: 4,
                          }}
                        >
                          {formErrors.name}
                        </Text>
                      )}

                      <TextInput
                        placeholder="Email Address (optional)"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 12,
                          padding: 14,
                          backgroundColor: theme.inputBackground,
                          fontSize: 16,
                          color: theme.textPrimary,
                          marginBottom: 16,
                        }}
                        placeholderTextColor={theme.placeholder}
                        accessibilityLabel="Email address input"
                        accessibilityHint="Enter your friend's email address"
                      />

                      <TextInput
                        placeholder="Phone Number (optional)"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        style={{
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 12,
                          padding: 14,
                          backgroundColor: theme.inputBackground,
                          fontSize: 16,
                          color: theme.textPrimary,
                          marginBottom: 16,
                        }}
                        placeholderTextColor={theme.placeholder}
                        accessibilityLabel="Phone number input"
                        accessibilityHint="Enter your friend's phone number"
                      />

                      <TextInput
                        placeholder="Emoji (optional, defaults to 👤)"
                        value={emoji}
                        onChangeText={setEmoji}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 12,
                          padding: 14,
                          backgroundColor: theme.inputBackground,
                          fontSize: 16,
                          color: theme.textPrimary,
                          marginBottom: 24,
                        }}
                        maxLength={2}
                        placeholderTextColor={theme.placeholder}
                        accessibilityLabel="Friend emoji input"
                        accessibilityHint="Enter one emoji for your friend's avatar"
                      />

                      <Pressable
                        onPress={handleAddOrUpdateFriend}
                        disabled={isSubmitting}
                        style={({ pressed }) => ({
                          backgroundColor: isSubmitting
                            ? theme.border
                            : pressed
                            ? theme.primaryPressed
                            : theme.primary,
                          paddingVertical: 16,
                          borderRadius: 12,
                          alignItems: "center",
                        })}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              fontSize: 16,
                            }}
                          >
                            {isEditing ? "Update Friend" : "Add Friend"}
                          </Text>
                        )}
                      </Pressable>

                      {email && !isEditing && (
                        <Text
                          style={{
                            textAlign: "center",
                            color: theme.textTertiary,
                            fontSize: 12,
                            marginTop: 12,
                            fontStyle: "italic",
                          }}
                        >
                          An invitation will be sent to their email
                        </Text>
                      )}
                    </View>
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </Modal>

          {/* Emoji Picker Modal */}
          <Modal
            visible={showEmojiPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowEmojiPicker(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: 20,
                  padding: 24,
                  width: "90%",
                  maxWidth: 350,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: theme.primary,
                    textAlign: "center",
                    marginBottom: 20,
                  }}
                >
                  Choose Your Emoji
                </Text>

                <ScrollView
                  style={{ maxHeight: 300 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                    }}
                  >
                    {[
                      "😊",
                      "😎",
                      "🤗",
                      "😄",
                      "😃",
                      "😁",
                      "😆",
                      "🥳",
                      "😉",
                      "🙂",
                      "😇",
                      "🤓",
                      "😌",
                      "😍",
                      "🥰",
                      "😘",
                      "😗",
                      "😚",
                      "😙",
                      "🤩",
                      "🤔",
                      "🤨",
                      "😐",
                      "😑",
                      "😶",
                      "🙄",
                      "😏",
                      "😣",
                      "😥",
                      "😮",
                      "🤐",
                      "😯",
                      "😪",
                      "😫",
                      "🥱",
                      "😴",
                      "😛",
                      "😝",
                      "😜",
                      "🤪",
                      "🤡",
                      "🥸",
                      "🤠",
                      "😺",
                      "😸",
                      "😹",
                      "😻",
                      "😼",
                      "😽",
                      "🙀",
                      "👤",
                      "👥",
                      "👶",
                      "👧",
                      "🧒",
                      "👦",
                      "👩",
                      "🧑",
                      "👨",
                      "👱‍♀️",
                      "👱",
                      "👱‍♂️",
                      "👩‍🦰",
                      "🧑‍🦰",
                      "👨‍🦰",
                      "👩‍🦱",
                      "🧑‍🦱",
                      "👨‍🦱",
                      "👩‍🦲",
                      "🧑‍🦲",
                    ].map((emojiOption) => (
                      <Pressable
                        key={emojiOption}
                        onPress={() => {
                          saveProfileEmoji(emojiOption);
                          setShowEmojiPicker(false);
                        }}
                        style={({ pressed }) => ({
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: pressed
                            ? theme.primary + "20"
                            : profileEmoji === emojiOption
                            ? theme.primary + "30"
                            : "transparent",
                          justifyContent: "center",
                          alignItems: "center",
                          margin: 5,
                          borderWidth: profileEmoji === emojiOption ? 2 : 0,
                          borderColor: theme.primary,
                        })}
                      >
                        <Text style={{ fontSize: 24 }}>{emojiOption}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                <Pressable
                  onPress={() => setShowEmojiPicker(false)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? theme.primaryPressed
                      : theme.primary,
                    borderRadius: 12,
                    paddingVertical: 12,
                    marginTop: 20,
                    alignItems: "center",
                  })}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "600",
                      fontSize: 16,
                    }}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

// Styles to match GroupsScreen and HistoryScreen action buttons
const styles = StyleSheet.create({
  // Action Buttons
  friendActions: {
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
  inviteButton: {
    backgroundColor: "#F1F8E9",
    borderColor: "#C8E6C9",
  },
  darkInviteButton: {
    backgroundColor: "#2D4A34",
    borderColor: "#4CAF50",
  },
  editButton: {
    backgroundColor: "#F8F4E8",
    borderColor: "#D4A574",
  },
  darkEditButton: {
    backgroundColor: "#3D3D3D",
    borderColor: "#D69E2E",
  },
  deleteButton: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFCDD2",
  },
  darkDeleteButton: {
    backgroundColor: "#4A2D32",
    borderColor: "#F44336",
  },
  inviteButtonText: {
    fontSize: 13,
    color: "#388E3C",
    fontWeight: "500",
  },
  darkInviteButtonText: {
    color: "#81C784",
  },
  editButtonText: {
    fontSize: 13,
    color: "#8B4513",
    fontWeight: "500",
  },
  darkEditButtonText: {
    color: "#D69E2E",
  },
  deleteButtonText: {
    fontSize: 13,
    color: "#D32F2F",
    fontWeight: "500",
  },
  darkDeleteButtonText: {
    color: "#EF5350",
  },
});

export default FriendsScreen;
