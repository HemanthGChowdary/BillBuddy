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
  Dimensions,
  Modal,
  ScrollView,
  Linking,
  Share,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

// Enhanced Friend Item Component
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
    darkMode = false, // Add darkMode prop
  }) => {
    const getBalanceText = (balance, name) => {
      if (Math.abs(balance) < 0.01) return "Settled up";
      if (balance > 0)
        return `${name} is owed $${Math.abs(balance).toFixed(2)}`;
      return `${name} owes $${Math.abs(balance).toFixed(2)}`;
    };

    const getBalanceColor = (balance) => {
      if (balance > 0) return "#4CAF50"; // Green: they owe you
      if (balance < 0) return "#F44336"; // Red: you owe them
      return "#757575"; // Gray: settled
    };

    return (
      <Animated.View
        style={{
          backgroundColor: darkMode ? "#2D3748" : "#fff",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderColor: darkMode ? "#4A5568" : "#e0e0e0",
          borderWidth: 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
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
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: darkMode ? "#4A5568" : "#EFE4D2",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
                borderWidth: 2,
                borderColor: Math.abs(balance) < 0.01 ? "#4CAF50" : "#e0e0e0",
              }}
            >
              <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: darkMode ? "#D69E2E" : "#8B4513", // Gold in dark mode, brown in light mode
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>

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
                <Text style={{ fontSize: 12, color: darkMode ? "#A0AEC0" : "#999" }}>
                  Last activity: {lastActivity}
                </Text>
              )}
            </View>
          </View>
        </Pressable>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Pressable
            onPress={() => onInvite(item)}
            style={({ pressed }) => ({
              backgroundColor: pressed 
                ? (darkMode ? "#2D4A34" : "#E8F5E8")
                : (darkMode ? "#064E3B" : "#F1F8E9"),
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              flex: 1,
              alignItems: "center",
              borderWidth: 1,
              borderColor: darkMode ? "#065F46" : "#C8E6C9",
            })}
          >
            <Text style={{ 
              fontSize: 13, 
              color: darkMode ? "#81C784" : "#388E3C", 
              fontWeight: "500" 
            }}>
              Invite
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onEdit(item.name)}
            style={({ pressed }) => ({
              backgroundColor: pressed 
                ? (darkMode ? "#653807" : "#F8F4E8")
                : (darkMode ? "#3D3D3D" : "#F8F4E8"),
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              flex: 1,
              alignItems: "center",
              borderWidth: 1,
              borderColor: darkMode ? "#D69E2E" : "#D4A574",
            })}
          >
            <Text style={{ 
              fontSize: 13, 
              color: darkMode ? "#D69E2E" : "#8B4513", // Gold in dark mode, brown in light mode
              fontWeight: "500" 
            }}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(item.name)}
            style={({ pressed }) => ({
              backgroundColor: pressed 
                ? (darkMode ? "#4A2D32" : "#FFEBEE")
                : (darkMode ? "#4A2D32" : "#FFF5F5"),
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              flex: 1,
              alignItems: "center",
              borderWidth: 1,
              borderColor: darkMode ? "#F44336" : "#FFCDD2",
            })}
          >
            <Text style={{ 
              fontSize: 13, 
              color: darkMode ? "#EF5350" : "#D32F2F", 
              fontWeight: "500" 
            }}>
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
  darkMode = false, // Add darkMode prop
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
  const [sortBy, setSortBy] = useState("name"); // name, balance, activity
  const [filterBy, setFilterBy] = useState("all"); // all, settled, owes, recent, highBalance

  // Animation for list items
  const animatedValue = useState(new Animated.Value(0))[0];

  // FIXED: Calculate balances for each friend
  const friendBalances = useMemo(() => {
    const balances = {};

    // Initialize all friends with 0 balance
    friends.forEach((friend) => {
      balances[friend.name] = 0;
    });

    // Process each bill
    bills.forEach((bill) => {
      const totalParticipants = bill.splitWith.length;
      const splitAmount = bill.amount / totalParticipants;

      // For each person in the split
      bill.splitWith.forEach((person) => {
        if (person === bill.payer) {
          // If this person paid the bill, they are owed by others
          // They paid the full amount but only owe their share
          const amountOwedToThem = bill.amount - splitAmount;
          if (balances.hasOwnProperty(person)) {
            balances[person] += amountOwedToThem;
          }
        } else {
          // If this person didn't pay, they owe their share to the payer
          if (balances.hasOwnProperty(person)) {
            balances[person] -= splitAmount;
          }
        }
      });

      // Handle case where the payer is not in friends list (i.e., it's you - profileName)
      if (bill.payer === profileName) {
        // You paid, so each friend in the split owes you their share
        bill.splitWith.forEach((person) => {
          if (person !== profileName && balances.hasOwnProperty(person)) {
            balances[person] += splitAmount;
          }
        });
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
          case "recent":
            // Show friends with activity in last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            return (friend.lastActivity || 0) > thirtyDaysAgo;
          case "highBalance":
            // Show friends with balance >= $20
            return Math.abs(balance) >= 20;
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
        const message = `Hi ${friendData.name}! ${profileName} has invited you to join their expense sharing group. Download our app to start splitting bills together!`;

        if (friendData.email) {
          // In a real app, you'd send an actual email invitation
          Alert.alert(
            "Invitation Sent",
            `An invitation has been sent to ${friendData.email}`,
            [{ text: "OK" }]
          );
        } else {
          // Share invitation via device's share functionality
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
    ({ item, index }) => (
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
        darkMode={darkMode} // Pass darkMode prop
      />
    ),
    [
      navigation,
      handleEdit,
      handleDelete,
      handleInviteFriend,
      animatedValue,
      friendBalances,
    ]
  );

  // FIXED: Summary stats calculation
  const summaryStats = useMemo(() => {
    const totalFriends = friends.length;
    const activeBalances = Object.values(friendBalances).filter(
      (b) => Math.abs(b) > 0.01
    ).length;

    let totalYouAreOwed = 0; // Sum of positive balances (friends owe you)
    let totalYouOwe = 0; // Sum of negative balances (you owe friends)

    Object.entries(friendBalances).forEach(([friendName, balance]) => {
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
      <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#1A1A1A" : "#EFE4D2" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={darkMode ? "#D69E2E" : "#8B4513"} />
          <Text style={{ 
            marginTop: 16, 
            fontSize: 16, 
            color: darkMode ? "#CBD5E0" : "#666" 
          }}>
            Loading friends...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#1A1A1A" : "#EFE4D2" }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ padding: 20, paddingBottom: 0 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{ 
                  fontSize: 28, 
                  fontWeight: "bold", 
                  color: darkMode ? "#D69E2E" : "#8B4513" // Gold in dark mode, brown in light mode
                }}
              >
                Friends
              </Text>
              <Pressable
                onPress={() => setShowAddModal(true)}
                style={({ pressed }) => ({
                  backgroundColor: pressed 
                    ? (darkMode ? "#B7791F" : "#6B3409")
                    : (darkMode ? "#D69E2E" : "#8B4513"), // Gold in dark mode, brown in light mode
                  borderRadius: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                })}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}
                >
                  + Add Friend
                </Text>
              </Pressable>
            </View>

            {/* Summary Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View
                  style={{
                    backgroundColor: darkMode ? "#2D3748" : "#fff",
                    borderRadius: 12,
                    padding: 12,
                    minWidth: 100,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                  >
                    {summaryStats.totalFriends}
                  </Text>
                  <Text style={{ fontSize: 12, color: darkMode ? "#CBD5E0" : "#666" }}>
                    Total Friends
                  </Text>
                </View>

                {(summaryStats.totalOwed > 0 || summaryStats.totalOwe > 0) && (
                  <Pressable
                    onPress={() => {
                      // TODO: Navigate to detailed balance breakdown
                      Alert.alert(
                        "Balance Breakdown", 
                        `You are owed: $${summaryStats.totalOwed.toFixed(2)}\nYou owe: $${summaryStats.totalOwe.toFixed(2)}\n\nTap on individual friends to see detailed breakdowns.`,
                        [{ text: "OK" }]
                      );
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: pressed 
                        ? (darkMode ? "#374151" : "#f5f5f5")
                        : (darkMode ? "#2D3748" : "#fff"),
                      borderRadius: 12,
                      padding: 12,
                      minWidth: 140,
                      alignItems: "center",
                    })}
                  >
                    <View style={{ alignItems: "center" }}>
                      {summaryStats.totalOwed > 0 && (
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: "#4CAF50",
                            marginBottom: 2,
                          }}
                        >
                          +${summaryStats.totalOwed.toFixed(2)}
                        </Text>
                      )}
                      {summaryStats.totalOwe > 0 && (
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: "#F44336",
                            marginBottom: 2,
                          }}
                        >
                          -${summaryStats.totalOwe.toFixed(2)}
                        </Text>
                      )}
                      <Text style={{ fontSize: 12, color: darkMode ? "#CBD5E0" : "#666" }}>
                        Your Balance
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>
            </ScrollView>

            {/* Search and Filters */}
            {friends.length > 0 && (
              <>
                <TextInput
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 12,
                    padding: 12,
                    backgroundColor: "#fff",
                    fontSize: 16,
                    marginBottom: 12,
                  }}
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 12 }}
                >
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                    {["all", "settled", "owes", "recent", "highBalance"].map((filter) => {
                      const getFilterLabel = (filter) => {
                        switch(filter) {
                          case "recent": return "Recent";
                          case "highBalance": return "High Balance";
                          default: return filter.charAt(0).toUpperCase() + filter.slice(1);
                        }
                      };
                      
                      return (
                        <Pressable
                          key={filter}
                          onPress={() => setFilterBy(filter)}
                          style={({ pressed }) => ({
                            backgroundColor:
                              filterBy === filter
                                ? (darkMode ? "#D69E2E" : "#8B4513") // Gold in dark mode, brown in light mode
                                : pressed
                                ? (darkMode ? "#374151" : "#f0f0f0")
                                : (darkMode ? "#2D3748" : "#fff"),
                            borderRadius: 16, // Match History screen
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderWidth: 1,
                            borderColor: filterBy === filter 
                              ? (darkMode ? "#D69E2E" : "#8B4513")
                              : (darkMode ? "#4A5568" : "#ddd"),
                          })}
                        >
                          <Text
                            style={{
                              color: filterBy === filter 
                                ? "#fff" 
                                : (darkMode ? "#E2E8F0" : "#666"),
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
                    const nextSort = sortBy === "name" ? "balance" : sortBy === "balance" ? "activity" : "name";
                    setSortBy(nextSort);
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: pressed 
                      ? (darkMode ? "#B7791F" : "#6B3409")
                      : (darkMode ? "#D69E2E" : "#8B4513"),
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: darkMode ? "#D69E2E" : "#8B4513",
                    alignSelf: "flex-start",
                    marginBottom: 12,
                  })}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    Sort: {sortBy === "name" ? "Name" : sortBy === "balance" ? "Balance" : "Activity"}
                  </Text>
                </Pressable>
              </>
            )}
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
                    color: darkMode ? "#CBD5E0" : "#666",
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
                    color: darkMode ? "#A0AEC0" : "#999",
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
                        ? (darkMode ? "#B7791F" : "#6B3409")
                        : (darkMode ? "#D69E2E" : "#8B4513"),
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
            <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#1A1A1A" : "#EFE4D2" }}>
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
                      color: darkMode ? "#D69E2E" : "#8B4513",
                    }}
                  >
                    {isEditing ? "Edit Friend" : "Add New Friend"}
                  </Text>
                  <Pressable onPress={cancelEdit}>
                    <Text style={{ fontSize: 16, color: darkMode ? "#CBD5E0" : "#666" }}>Cancel</Text>
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View
                    style={{
                      backgroundColor: darkMode ? "#2D3748" : "#fff",
                      borderRadius: 16,
                      padding: 20,
                    }}
                  >
                    <TextInput
                      placeholder="Friend's Name *"
                      value={friend}
                      onChangeText={setFriend}
                      style={{
                        borderWidth: 1,
                        borderColor: darkMode ? "#4A5568" : "#ddd",
                        borderRadius: 12,
                        padding: 14,
                        backgroundColor: darkMode ? "#1A202C" : "#f9f9f9",
                        fontSize: 16,
                        color: darkMode ? "#FFFFFF" : "#374151",
                        marginBottom: 16,
                      }}
                      maxLength={50}
                      placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                    />

                    <TextInput
                      placeholder="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{
                        borderWidth: 1,
                        borderColor: darkMode ? "#4A5568" : "#ddd",
                        borderRadius: 12,
                        padding: 14,
                        backgroundColor: darkMode ? "#1A202C" : "#f9f9f9",
                        fontSize: 16,
                        color: darkMode ? "#FFFFFF" : "#374151",
                        marginBottom: 16,
                      }}
                      placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                    />

                    <TextInput
                      placeholder="Phone Number"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      style={{
                        borderWidth: 1,
                        borderColor: darkMode ? "#4A5568" : "#ddd",
                        borderRadius: 12,
                        padding: 14,
                        backgroundColor: darkMode ? "#1A202C" : "#f9f9f9",
                        fontSize: 16,
                        color: darkMode ? "#FFFFFF" : "#374151",
                        marginBottom: 16,
                      }}
                      placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                    />

                    <TextInput
                      placeholder="Emoji (optional, defaults to 👤)"
                      value={emoji}
                      onChangeText={setEmoji}
                      style={{
                        borderWidth: 1,
                        borderColor: "#ddd",
                        borderRadius: 12,
                        padding: 14,
                        backgroundColor: "#f9f9f9",
                        fontSize: 16,
                        marginBottom: 24,
                        color: darkMode ? "#FFFFFF" : "#333",
                      }}
                      maxLength={2}
                      placeholderTextColor="#999"
                    />

                    <Pressable
                      onPress={handleAddOrUpdateFriend}
                      disabled={isSubmitting}
                      style={({ pressed }) => ({
                        backgroundColor: isSubmitting
                          ? (darkMode ? "#4A5568" : "#ccc")
                          : pressed
                          ? (darkMode ? "#B7791F" : "#6B3409")
                          : (darkMode ? "#D69E2E" : "#8B4513"),
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
                          color: darkMode ? "#A0AEC0" : "#666",
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
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default FriendsScreen;
