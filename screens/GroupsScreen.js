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
  RefreshControl,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";

// Currency options
const currencyOptions = [
  { label: "🇺🇸 USD", value: "USD" },
  { label: "🇨🇦 CAD", value: "CAD" },
  { label: "🇮🇳 INR", value: "INR" },
  { label: "🇲🇽 MXN", value: "MXN" },
];

const getCurrencySymbol = (currency) => {
  const symbols = { USD: "$", CAD: "C$", INR: "₹", MXN: "$" };
  return symbols[currency] || "$";
};

// Optimized Group Card Component
const GroupCard = React.memo(
  ({ group, onPress, onEdit, onDelete, darkMode }) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const calculateGroupBalance = () => {
      if (!group.bills || group.bills.length === 0) return 0;
      return group.bills.reduce((total, bill) => total + (bill.amount || 0), 0);
    };

    const getRecentActivity = () => {
      if (!group.bills || group.bills.length === 0) return "No activity";
      const lastBill = group.bills[group.bills.length - 1];
      return `Last: ${lastBill.description || "Bill"} - ${formatDate(
        lastBill.date
      )}`;
    };

    return (
      <Pressable
        style={({ pressed }) => [
          styles.groupCard,
          darkMode && styles.darkGroupCard,
          pressed && styles.groupCardPressed,
        ]}
        onPress={() => onPress(group)}
      >
        <View style={styles.groupCardHeader}>
          <View style={styles.groupMainInfo}>
            <Text
              style={[styles.groupName, darkMode && styles.darkText]}
              numberOfLines={1}
            >
              {group.name || "Unnamed Group"}
            </Text>
            <Text style={[styles.groupBalance, darkMode && styles.darkGroupBalance]}>
              {getCurrencySymbol(group.currency || "USD")}
              {calculateGroupBalance().toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Action Buttons - matching Friends/History screen styling */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 6,
              marginTop: 8,
            }}
          >
            {/* Add Members Button */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                // TODO: Implement add members functionality
                console.log("Add members to", group.name);
              }}
              style={({ pressed }) => [
                {
                  backgroundColor: darkMode ? "#2D4A34" : "#F1F8E9",
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
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
                  fontSize: 12,
                  color: darkMode ? "#81C784" : "#388E3C",
                  fontWeight: "500",
                }}
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
                {
                  backgroundColor: darkMode ? "#3D3D3D" : "#F8F4E8",
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
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
                  fontSize: 12,
                  color: darkMode ? "#D69E2E" : "#8B4513",
                  fontWeight: "500",
                }}
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
                {
                  backgroundColor: darkMode ? "#4A2C2C" : "#FFEBEE",
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
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
                  fontSize: 12,
                  color: darkMode ? "#EF5350" : "#D32F2F",
                  fontWeight: "500",
                }}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Enhanced Group Details Section */}
        <View style={styles.groupDetails}>
          <View style={[styles.groupStatsRow, darkMode && styles.darkGroupStatsRow]}>
            <View style={styles.statItem}>
              <Ionicons
                name="people"
                size={16}
                color={darkMode ? "#A0AEC0" : "#6B7280"}
              />
              <Text
                style={[styles.statText, darkMode && styles.darkSubtext]}
              >
                {group.members && group.members.length > 0
                  ? group.members.length
                  : 0}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons
                name="receipt"
                size={16}
                color={darkMode ? "#A0AEC0" : "#6B7280"}
              />
              <Text
                style={[styles.statText, darkMode && styles.darkSubtext]}
              >
                {group.bills ? group.bills.length : 0}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons
                name="time"
                size={16}
                color={darkMode ? "#A0AEC0" : "#6B7280"}
              />
              <Text
                style={[styles.statText, darkMode && styles.darkSubtext]}
                numberOfLines={1}
              >
                {group.bills && group.bills.length > 0 ? "Active" : "No activity"}
              </Text>
            </View>
          </View>

          {/* Recent Expense Preview */}
          {group.bills && group.bills.length > 0 && (
            <View style={[styles.recentExpensePreview, darkMode && styles.darkRecentExpensePreview]}>
              <Text style={[styles.recentExpenseLabel, darkMode && styles.darkSubtext]}>
                Latest: {group.bills[group.bills.length - 1]?.description || "Expense"}
              </Text>
              <Text style={[styles.recentExpenseAmount, darkMode && styles.darkAmount]}>
                {getCurrencySymbol(group.currency || "USD")}
                {group.bills[group.bills.length - 1]?.amount?.toFixed(2) || "0.00"}
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
        </View>
      </Pressable>
    );
  }
);

export default function GroupsScreen({
  friends,
  bills,
  addBill,
  profileName,
  darkMode = false,
}) {
  // Core state
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

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

  const you = profileName && profileName.trim() ? profileName.trim() : "You";

  // Get friends dropdown options
  const friendsDropdownOptions = useMemo(() => {
    if (!friends || !Array.isArray(friends))
      return [{ label: you, value: you }];

    const friendOptions = friends.map((friend) => ({
      label: `${friend.emoji || "👤"} ${friend.name}`,
      value: friend.name,
    }));

    return [{ label: `👤 ${you}`, value: you }, ...friendOptions];
  }, [friends, you]);

  // Filtered groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;

    const query = searchQuery.toLowerCase();
    return groups.filter(
      (group) =>
        group.name?.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query) ||
        group.members?.some((member) => member.toLowerCase().includes(query))
    );
  }, [groups, searchQuery]);

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Load groups from storage
  const loadGroups = async () => {
    try {
      setLoading(true);
      const savedGroups = await AsyncStorage.getItem("billBuddy_groups");
      if (savedGroups) {
        const parsedGroups = JSON.parse(savedGroups);
        setGroups(Array.isArray(parsedGroups) ? parsedGroups : []);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
      Alert.alert("Error", "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  // Save groups to storage
  const saveGroups = async (updatedGroups) => {
    try {
      await AsyncStorage.setItem(
        "billBuddy_groups",
        JSON.stringify(updatedGroups)
      );
      setGroups(updatedGroups);
    } catch (error) {
      console.error("Error saving groups:", error);
      Alert.alert("Error", "Failed to save changes");
    }
  };

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  }, []);

  // Validation functions
  const validateGroupForm = () => {
    const newErrors = {};

    if (!newGroupName?.trim()) {
      newErrors.groupName = "Group name is required";
    }

    if (!selectedMembers || selectedMembers.length === 0) {
      newErrors.members = "Please select at least one member";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateExpenseForm = () => {
    const newErrors = {};

    if (!expenseName?.trim()) {
      newErrors.expenseName = "Expense name is required";
    }

    const amount = parseFloat(expenseAmount);
    if (!expenseAmount?.trim() || isNaN(amount) || amount <= 0) {
      newErrors.expenseAmount = "Valid amount is required";
    }

    if (!expensePaidBy) {
      newErrors.expensePaidBy = "Please select who paid";
    }

    if (!expenseSplitWith || expenseSplitWith.length === 0) {
      newErrors.expenseSplitWith =
        "Please select at least one person to split with";
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
        id: Date.now().toString(),
        name: newGroupName.trim(),
        description: groupDescription.trim(),
        currency: groupCurrency,
        members: [...selectedMembers],
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
      console.error("Error creating group:", error);
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
      console.error("Error editing group:", error);
      Alert.alert("Error", "Failed to update group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGroup = (groupId) => {
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
              Alert.alert("Error", "Failed to delete group");
            }
          },
        },
      ]
    );
  };

  const addExpenseToGroup = async () => {
    if (!validateExpenseForm() || !selectedGroup) return;

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newExpense = {
        id: Date.now().toString(),
        name: expenseName.trim(),
        amount: parseFloat(expenseAmount),
        payer: expensePaidBy,
        splitWith: [...expenseSplitWith],
        note: expenseNote.trim(),
        currency: selectedGroup.currency || "USD",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        groupId: selectedGroup.id,
        splitType: "equal", // Default to equal split
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

      resetExpenseForm();
      setShowAddExpense(false);

      Alert.alert("Success! 💰", "Expense added successfully!");
    } catch (error) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", "Failed to add expense");
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
    setErrors({});
    setPayerDropdownOpen(false);
    setSplitDropdownOpen(false);
  };

  const closeAllDropdowns = useCallback(() => {
    setMembersDropdownOpen(false);
    setCurrencyDropdownOpen(false);
    setPayerDropdownOpen(false);
    setSplitDropdownOpen(false);
  }, []);

  const handleGroupPress = (group) => {
    setSelectedGroup(group);
    setShowGroupDetails(true);
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setNewGroupName(group.name || "");
    setGroupDescription(group.description || "");
    setGroupCurrency(group.currency || "USD");
    setSelectedMembers([...(group.members || [])]);
    setShowEditGroup(true);
  };

  const renderGroupItem = useCallback(
    ({ item }) => (
      <GroupCard
        group={item}
        onPress={handleGroupPress}
        onEdit={handleEditGroup}
        onDelete={deleteGroup}
        darkMode={darkMode}
      />
    ),
    [darkMode]
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, darkMode && styles.darkEmptyIcon]}>
        <Ionicons
          name="people-outline"
          size={64}
          color={darkMode ? "#4A5568" : "#D1D5DB"}
        />
      </View>
      <Text style={[styles.emptyTitle, darkMode && styles.darkText]}>
        {searchQuery ? "No groups found" : "No groups yet"}
      </Text>
      <Text style={[styles.emptySubtitle, darkMode && styles.darkSubtext]}>
        {searchQuery
          ? "Try adjusting your search terms"
          : "Create your first group to start splitting expenses with friends!"}
      </Text>
      {searchQuery && (
        <TouchableOpacity
          onPress={() => setSearchQuery("")}
          style={[
            styles.clearSearchButton,
            darkMode && styles.darkClearSearchButton,
          ]}
        >
          <Text style={[styles.clearSearchText, darkMode && styles.darkText]}>
            Clear Search
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
            color={darkMode ? "#D69E2E" : "#8B4513"}
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, darkMode && styles.darkTitle]}>
            Groups
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
              style={[styles.searchInput, darkMode && styles.darkText]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchIcon}
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
              pressed && styles.addGroupButtonPressed,
            ]}
            onPress={() => setShowCreateGroup(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addGroupButtonText}>Create New Group</Text>
          </Pressable>
        </View>

        {/* Groups List */}
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          contentContainerStyle={[
            styles.listContainer,
            filteredGroups.length === 0 && styles.emptyListContainer,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[darkMode ? "#D69E2E" : "#8B4513"]}
              tintColor={darkMode ? "#D69E2E" : "#8B4513"}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          keyboardShouldPersistTaps="handled"
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
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={styles.modalContent}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                  Create Group
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowCreateGroup(false);
                    resetGroupForm();
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={darkMode ? "#E2E8F0" : "#374151"}
                  />
                </TouchableOpacity>
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
                      setNewGroupName(text);
                      if (errors.groupName)
                        setErrors((prev) => ({ ...prev, groupName: null }));
                    }}
                    style={[
                      styles.textInput,
                      darkMode && styles.darkTextInput,
                      errors.groupName && styles.inputError,
                    ]}
                    maxLength={50}
                  />
                  {errors.groupName && (
                    <Text style={styles.errorText}>{errors.groupName}</Text>
                  )}
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
                    onChangeText={setGroupDescription}
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
                    items={currencyOptions}
                    setOpen={(open) => {
                      closeAllDropdowns();
                      setCurrencyDropdownOpen(open);
                    }}
                    setValue={setGroupCurrency}
                    setItems={() => {}}
                    style={[styles.dropdown, darkMode && styles.darkDropdown]}
                    zIndex={3000}
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
                    listMode="SCROLLVIEW"
                    scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
                  />
                </View>

                {/* Members */}
                <View style={[styles.inputGroup, { marginBottom: 32 }]}>
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
                      mode="BADGE"
                      searchable
                      searchPlaceholder="Search..."
                      listMode="SCROLLVIEW"
                      scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
                      zIndex={2000}
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
              </ScrollView>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowCreateGroup(false);
                    resetGroupForm();
                  }}
                  style={[styles.modalButton, styles.cancelButton]}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={createGroup}
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
                    <Text style={styles.saveButtonText}>Create Group</Text>
                  )}
                </TouchableOpacity>
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
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={styles.modalContent}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                  Edit Group
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowEditGroup(false);
                    setEditingGroup(null);
                    resetGroupForm();
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={darkMode ? "#E2E8F0" : "#374151"}
                  />
                </TouchableOpacity>
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
                      setNewGroupName(text);
                      if (errors.groupName)
                        setErrors((prev) => ({ ...prev, groupName: null }));
                    }}
                    style={[
                      styles.textInput,
                      darkMode && styles.darkTextInput,
                      errors.groupName && styles.inputError,
                    ]}
                    maxLength={50}
                  />
                  {errors.groupName && (
                    <Text style={styles.errorText}>{errors.groupName}</Text>
                  )}
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
                    onChangeText={setGroupDescription}
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
                    items={currencyOptions}
                    setOpen={(open) => {
                      closeAllDropdowns();
                      setCurrencyDropdownOpen(open);
                    }}
                    setValue={setGroupCurrency}
                    setItems={() => {}}
                    style={[styles.dropdown, darkMode && styles.darkDropdown]}
                    zIndex={3000}
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
                    listMode="SCROLLVIEW"
                    scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
                  />
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
                      mode="BADGE"
                      searchable
                      searchPlaceholder="Search..."
                      listMode="SCROLLVIEW"
                      scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
                      zIndex={2000}
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
              </ScrollView>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowEditGroup(false);
                    setEditingGroup(null);
                    resetGroupForm();
                  }}
                  style={[styles.modalButton, styles.cancelButton]}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={editGroup}
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
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
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
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={styles.modalContent}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text
                  style={[styles.modalTitle, darkMode && styles.darkText]}
                  numberOfLines={1}
                >
                  {selectedGroup?.name || "Group Details"}
                </Text>
                <View style={styles.modalHeaderActions}>
                  <TouchableOpacity
                    onPress={() => setShowAddExpense(true)}
                    style={styles.addExpenseButton}
                  >
                    <Ionicons
                      name="add"
                      size={16}
                      color={darkMode ? "#D69E2E" : "#8B4513"}
                    />
                    <Text style={styles.addExpenseButtonText}>Add Expense</Text>
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
                      color={darkMode ? "#E2E8F0" : "#374151"}
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
                  <View style={styles.groupInfoCard}>
                    <View style={styles.groupInfoRow}>
                      <Ionicons
                        name="people"
                        size={20}
                        color={darkMode ? "#D69E2E" : "#8B4513"}
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
                        color={darkMode ? "#D69E2E" : "#8B4513"}
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
                        color={darkMode ? "#D69E2E" : "#8B4513"}
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
                          selectedGroup?.bills?.reduce(
                            (sum, bill) => sum + (bill.amount || 0),
                            0
                          ) || 0
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
                  {selectedGroup?.members?.length > 0 ? (
                    <View style={styles.membersList}>
                      {selectedGroup.members.map((member, index) => (
                        <View
                          key={index}
                          style={[
                            styles.memberChip,
                            darkMode && styles.darkMemberChip,
                          ]}
                        >
                          <Text
                            style={[
                              styles.memberName,
                              darkMode && styles.darkText,
                            ]}
                          >
                            {member === you ? `${member} (You)` : member}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.noDataText,
                        darkMode && styles.darkSubtext,
                      ]}
                    >
                      No members in this group
                    </Text>
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
                            </View>
                            <View style={styles.expenseDetails}>
                              <Text
                                style={[
                                  styles.expenseDetail,
                                  darkMode && styles.darkSubtext,
                                ]}
                              >
                                Paid by {bill.payer || "Unknown"}
                              </Text>
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
                            {bill.note && (
                              <Text
                                style={[
                                  styles.expenseNote,
                                  darkMode && styles.darkSubtext,
                                ]}
                                numberOfLines={2}
                              >
                                {bill.note}
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
          }}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={styles.modalContent}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View
                style={[
                  styles.modalHeader,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                  Add Expense
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowAddExpense(false);
                    resetExpenseForm();
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={darkMode ? "#E2E8F0" : "#374151"}
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
                      setExpenseName(text);
                      if (errors.expenseName)
                        setErrors((prev) => ({ ...prev, expenseName: null }));
                    }}
                    style={[
                      styles.textInput,
                      darkMode && styles.darkTextInput,
                      errors.expenseName && styles.inputError,
                    ]}
                    maxLength={50}
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
                    <Text style={styles.currencySymbol}>
                      {getCurrencySymbol(selectedGroup?.currency || "USD")}
                    </Text>
                    <TextInput
                      placeholder="0.00"
                      placeholderTextColor={darkMode ? "#888" : "#999"}
                      keyboardType="numeric"
                      value={expenseAmount}
                      onChangeText={(text) => {
                        setExpenseAmount(text);
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
                    items={
                      selectedGroup?.members?.map((member) => ({
                        label: member === you ? `${member} (You)` : member,
                        value: member,
                      })) || []
                    }
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
                    searchable
                    searchPlaceholder="Search..."
                    listMode="SCROLLVIEW"
                    scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
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
                    items={
                      selectedGroup?.members?.map((member) => ({
                        label: member === you ? `${member} (You)` : member,
                        value: member,
                      })) || []
                    }
                    setOpen={(open) => {
                      closeAllDropdowns();
                      setSplitDropdownOpen(open);
                    }}
                    setValue={setExpenseSplitWith}
                    setItems={() => {}}
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
                    mode="BADGE"
                    searchable
                    searchPlaceholder="Search..."
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
                    badgeTextStyle={{ color: "black" }}
                  />
                  {errors.expenseSplitWith && (
                    <Text style={styles.errorText}>
                      {errors.expenseSplitWith}
                    </Text>
                  )}
                </View>

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
                    onChangeText={setExpenseNote}
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
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    closeAllDropdowns();
                    setShowAddExpense(false);
                    resetExpenseForm();
                  }}
                  style={[styles.modalButton, styles.cancelButton]}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
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
                    <Text style={styles.saveButtonText}>Add Expense</Text>
                  )}
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
    flexGrow: 1,
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
    color: "#E2E8F0",
  },
  darkSubtext: {
    color: "#A0AEC0",
  },
  darkAmount: {
    color: "#4A90E2",
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
  clearSearchIcon: {
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
    height: 12,
  },

  // Group Card
  groupCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
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
  groupStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
  },
  darkGroupStatsRow: {
    backgroundColor: "#1A202C",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
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
    marginBottom: 20,
  },
  clearSearchButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  darkClearSearchButton: {
    backgroundColor: "#D69E2E",
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
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxHeight: "85%",
    minHeight: "60%",
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
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B4513",
    flex: 1,
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
  addExpenseButtonText: {
    color: "#8B4513",
    fontSize: 14,
    fontWeight: "600",
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
    marginBottom: 20,
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
  dropdownPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
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
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  saveButton: {
    backgroundColor: "#2356A8",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    marginBottom: 24,
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

  // Expenses
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  darkExpenseItem: {
    backgroundColor: "#1A202C",
    borderColor: "#4A5568",
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    marginRight: 12,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2356A8",
  },
  expenseDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  expenseDetail: {
    fontSize: 14,
    color: "#6B7280",
  },
  expenseDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  expenseNote: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  moreExpensesText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 8,
  },
});
