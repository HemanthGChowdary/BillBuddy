import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "react-native";
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
  }) => {
    const getBalanceText = (balance, name) => {
      if (Math.abs(balance) < 0.01) return "All settled up"; // Better than "No pending balances"
      if (balance > 0)
        return `${name} owes ${profileName || "you"} $${Math.abs(
          balance
        ).toFixed(2)}`;
      return `${profileName || "You"} owes ${name} $${Math.abs(balance).toFixed(
        2
      )}`;
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
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderColor: darkMode ? "#4A5568" : "#e0e0e0",
          borderWidth: 1,
          shadowColor: darkMode ? "#000000" : "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: darkMode ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 4,
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
          style={{ marginBottom: 12 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Avatar with Status Indicator */}
            <View style={{ position: "relative", marginRight: 16 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: darkMode ? "#4A5568" : "#EFE4D2",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: getAvatarBorderColor(balance),
                }}
              >
                <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
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
                  marginBottom: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
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
                    fontSize: 12,
                    color: getStatusColor(),
                    fontWeight: "500",
                    marginLeft: 8,
                  }}
                >
                  {getStatusText()}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 14,
                  color: getBalanceColor(balance),
                  fontWeight: "500",
                  marginBottom: 2,
                }}
              >
                {getBalanceText(balance, item.name)}
              </Text>

              {lastActivity && (
                <Text
                  style={{
                    fontSize: 12,
                    color: darkMode ? "#A0AEC0" : "#718096",
                  }}
                >
                  Last activity: {lastActivity}
                </Text>
              )}
            </View>
          </View>
        </Pressable>

        {/* Action Buttons with enhanced dark mode styling */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          {/* Invite Button - matches History Duplicate button */}
          <Pressable
            onPress={() => onInvite(item)}
            style={({ pressed }) => [
              {
                backgroundColor: darkMode ? "#2D4A34" : "#F1F8E9",
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 14,
                flex: 1,
                alignItems: "center",
                borderWidth: 1,
                borderColor: darkMode ? "#4CAF50" : "#C8E6C9",
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                color: darkMode ? "#81C784" : "#388E3C",
                fontWeight: "500",
              }}
            >
              Invite
            </Text>
          </Pressable>

          {/* Edit Button - matches History Edit button */}
          <Pressable
            onPress={() => onEdit(item.name)}
            style={({ pressed }) => [
              {
                backgroundColor: darkMode ? "#3D3D3D" : "#F8F4E8",
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 14,
                flex: 1,
                alignItems: "center",
                borderWidth: 1,
                borderColor: darkMode ? "#D69E2E" : "#D4A574",
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                color: darkMode ? "#D69E2E" : "#8B4513",
                fontWeight: "500",
              }}
            >
              Edit
            </Text>
          </Pressable>

          {/* Delete Button - matches History Delete button */}
          <Pressable
            onPress={() => onDelete(item.name)}
            style={({ pressed }) => [
              {
                backgroundColor: darkMode ? "#4A2D32" : "#FFF5F5",
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 14,
                flex: 1,
                alignItems: "center",
                borderWidth: 1,
                borderColor: darkMode ? "#F44336" : "#FFCDD2",
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                color: darkMode ? "#EF5350" : "#D32F2F",
                fontWeight: "500",
              }}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }
);

const FriendsScreen = ({
  friends,
  setFriends,
  navigation,
  bills,
  profileName,
  profileEmoji,
  setProfileEmoji,
  darkMode = false,
}) => {
  const [friend, setFriend] = useState("");
  const [emoji, setEmoji] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
    const balances = {};
    const currentUser = profileName?.trim();

    // Ensure we have a valid profile name
    if (!currentUser) {
      console.warn("No profile name set. User should sign in first.");
      return {};
    }

    // Initialize all friends with 0 balance
    friends.forEach((friend) => {
      balances[friend.name] = 0;
    });

    // Process each bill
    bills.forEach((bill) => {
      const totalParticipants = bill.splitWith.length;
      if (totalParticipants === 0) return; // Skip invalid bills

      const splitAmount = bill.amount / totalParticipants;

      // Only process bills where the current user is involved
      if (!bill.splitWith.includes(currentUser) && bill.payer !== currentUser) {
        return;
      }

      if (bill.payer === currentUser) {
        // Current user paid the bill - friends owe the current user
        bill.splitWith.forEach((person) => {
          if (person !== currentUser && balances.hasOwnProperty(person)) {
            balances[person] += splitAmount; // Friend owes current user
          }
        });
      } else if (balances.hasOwnProperty(bill.payer)) {
        // A friend paid the bill, and current user is in the split
        if (bill.splitWith.includes(currentUser)) {
          balances[bill.payer] -= splitAmount; // Current user owes the friend
        }
      }
    });

    return balances;
  }, [friends, bills, profileName]);

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
  const saveProfileEmoji = useCallback(async (newEmoji) => {
    try {
      await AsyncStorage.setItem("profileEmoji", newEmoji);
      setProfileEmoji(newEmoji);
    } catch (error) {
      console.error("Failed to save profile emoji:", error);
    }
  }, [setProfileEmoji]);

  // Load friends with better error handling
  const loadFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      const saved = await AsyncStorage.getItem("friends");
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
    } catch (err) {
      console.error("Failed to load friends", err);
      Alert.alert("Error", "Failed to load friends. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [setFriends]);

  // Save friends with debouncing
  const saveFriends = useCallback(async (friendsToSave) => {
    try {
      await AsyncStorage.setItem("friends", JSON.stringify(friendsToSave));
    } catch (err) {
      console.error("Failed to save friends", err);
      Alert.alert("Error", "Failed to save changes.");
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    if (friends.length > 0) {
      saveFriends(friends);
    }
  }, [friends, saveFriends]);

  // Enhanced form validation
  const validateFriend = useCallback(
    (name, currentEmoji, currentEmail, currentPhone) => {
      const trimmed = name.trim();
      const trimmedEmoji = currentEmoji.trim() || "👤";
      const trimmedEmail = currentEmail.trim();
      const trimmedPhone = currentPhone.trim();

      if (!trimmed) {
        return { isValid: false, message: "Please enter a friend's name." };
      }

      if (trimmed.length > 50) {
        return {
          isValid: false,
          message: "Name is too long (max 50 characters).",
        };
      }

      if (trimmed === profileName) {
        return {
          isValid: false,
          message: "You are already included by default.",
        };
      }

      // Email validation
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return {
          isValid: false,
          message: "Please enter a valid email address.",
        };
      }

      // Phone validation (basic)
      if (trimmedPhone && !/^\+?[\d\s\-\(\)]{10,}$/.test(trimmedPhone)) {
        return {
          isValid: false,
          message: "Please enter a valid phone number.",
        };
      }

      const isDuplicate = friends.some(
        (f) =>
          (f.name.toLowerCase() === trimmed.toLowerCase() ||
            (trimmedEmail && f.email === trimmedEmail)) &&
          (!isEditing || f.name !== editingName)
      );

      if (isDuplicate) {
        return {
          isValid: false,
          message: "A friend with this name or email already exists!",
        };
      }

      return {
        isValid: true,
        name: trimmed,
        emoji: trimmedEmoji,
        email: trimmedEmail,
        phone: trimmedPhone,
      };
    },
    [friends, profileName, isEditing, editingName]
  );

  const handleAddOrUpdateFriend = useCallback(async () => {
    if (isSubmitting) return;

    const validation = validateFriend(friend, emoji, email, phone);

    if (!validation.isValid) {
      Alert.alert("Invalid Input", validation.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const newFriend = {
        name: validation.name,
        emoji: validation.emoji,
        email: validation.email,
        phone: validation.phone,
        lastActivity: Date.now(),
        id: isEditing
          ? friends.find((f) => f.name === editingName)?.id
          : `friend-${Date.now()}-${Math.random()}`,
      };

      if (isEditing) {
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
      Keyboard.dismiss();

      // Success animation
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start(() => {
        animatedValue.setValue(0);
      });

      // Send invitation if email provided
      if (validation.email && !isEditing) {
        handleInviteFriend(newFriend);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save friend. Please try again.");
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
          await Share.share({
            message: message,
            title: "Join My Expense Group",
          });
        }
      } catch (error) {
        console.error("Failed to send invitation:", error);
      }
    },
    [profileName]
  );

  const handleDelete = useCallback(
    (name) => {
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
            onPress: () => {
              setFriends((prev) => prev.filter((f) => f.name !== name));
            },
          },
        ]
      );
    },
    [friendBalances, setFriends]
  );

  const handleEdit = useCallback(
    (name) => {
      const friendToEdit = friends.find((f) => f.name === name);
      if (!friendToEdit) return;

      setIsEditing(true);
      setEditingName(name);
      setFriend(friendToEdit.name);
      setEmoji(friendToEdit.emoji || "");
      setEmail(friendToEdit.email || "");
      setPhone(friendToEdit.phone || "");
      setShowAddModal(true);
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
  }, []);

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
    ]
  );

  // Summary stats calculation
  const summaryStats = useMemo(() => {
    const totalFriends = friends.length;
    const activeBalances = Object.values(friendBalances).filter(
      (b) => Math.abs(b) > 0.01
    ).length;

    let totalYouAreOwed = 0;
    let totalYouOwe = 0;

    Object.entries(friendBalances).forEach(([, balance]) => {
      if (balance > 0) {
        totalYouAreOwed += balance;
      } else if (balance < 0) {
        totalYouOwe += Math.abs(balance);
      }
    });

    return {
      totalFriends,
      activeBalances,
      totalOwed: totalYouAreOwed,
      totalOwe: totalYouOwe,
    };
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ padding: 20, paddingBottom: 0 }}>
            <View style={{ marginBottom: 20 }}>
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
              <Text
                style={{
                  fontSize: 16,
                  color: theme.textSecondary,
                  textAlign: "center",
                }}
              >
                Manage your friend connections
              </Text>
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
                    
                    {summaryStats.totalOwed > 0 && (
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: "#4CAF50",
                          textAlign: "left",
                          marginBottom: 2,
                        }}
                      >
                        You are owed: ${summaryStats.totalOwed.toFixed(2)}
                      </Text>
                    )}
                    
                    {summaryStats.totalOwe > 0 && (
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: "#F44336",
                          textAlign: "left",
                          marginBottom: 2,
                        }}
                      >
                        You owe: ${summaryStats.totalOwe.toFixed(2)}
                      </Text>
                    )}
                    
                    {summaryStats.totalOwed === 0 && summaryStats.totalOwe === 0 && (
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: theme.textSecondary,
                          textAlign: "left",
                          marginBottom: 2,
                        }}
                      >
                        All settled up
                      </Text>
                    )}
                    
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
            contentContainerStyle={{ padding: 20, paddingTop: 0, flexGrow: 1 }}
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
                      onChangeText={setFriend}
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
                      maxLength={50}
                      placeholderTextColor={theme.placeholder}
                    />

                    <TextInput
                      placeholder="Email Address"
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
                    />

                    <TextInput
                      placeholder="Phone Number"
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
                      "😊", "😎", "🤗", "😄", "😃", "😁", "😆", "🥳", "😉", "🙂",
                      "😇", "🤓", "😌", "😍", "🥰", "😘", "😗", "😚", "😙", "🤩",
                      "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮",
                      "🤐", "😯", "😪", "😫", "🥱", "😴", "😛", "😝", "😜", "🤪",
                      "🤡", "🥸", "🤠", "😺", "😸", "😹", "😻", "😼", "😽", "🙀",
                      "👤", "👥", "👶", "👧", "🧒", "👦", "👩", "🧑", "👨", "👱‍♀️",
                      "👱", "👱‍♂️", "👩‍🦰", "🧑‍🦰", "👨‍🦰", "👩‍🦱", "🧑‍🦱", "👨‍🦱", "👩‍🦲", "🧑‍🦲"
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
                    backgroundColor: pressed ? theme.primaryPressed : theme.primary,
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

export default FriendsScreen;
