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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import DropDownPicker from "react-native-dropdown-picker";

export default function GroupsScreen({ friends, bills, addBill, profileName }) {
  // Core state
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  // Form states
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [membersDropdownOpen, setMembersDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // Bill states
  const [billDescription, setBillDescription] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billPaidBy, setBillPaidBy] = useState("");
  const [billSplitWith, setBillSplitWith] = useState([]);

  // Settlement states
  const [settleFromMember, setSettleFromMember] = useState("");
  const [settleToMember, setSettleToMember] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  // Get friends dropdown options
  const friendsDropdownOptions = useMemo(() => {
    if (!friends || !Array.isArray(friends)) {
      return [];
    }
    return friends.map((friend) => ({
      label: `${friend.emoji || "👤"} ${friend.name}`,
      value: friend.name,
    }));
  }, [friends]);

  // Load data on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Load groups from storage
  const loadGroups = async () => {
    try {
      setLoading(true);
      const savedGroups = await AsyncStorage.getItem("billBuddy_groups");
      if (savedGroups) {
        setGroups(JSON.parse(savedGroups));
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

  // Validation
  const validateGroupForm = () => {
    const newErrors = {};

    if (!newGroupName || !newGroupName.trim()) {
      newErrors.groupName = "Group name is required";
    }

    if (
      !selectedMembers ||
      !Array.isArray(selectedMembers) ||
      selectedMembers.length === 0
    ) {
      newErrors.members = "Please select at least one member";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create group
  const createGroup = async () => {
    if (!validateGroupForm()) {
      return;
    }

    try {
      const newGroup = {
        id: Date.now(),
        name: newGroupName.trim(),
        members: Array.isArray(selectedMembers) ? [...selectedMembers] : [],
        createdAt: new Date().toISOString(),
        bills: [],
        settlements: [],
      };

      const currentGroups = Array.isArray(groups) ? groups : [];
      const updatedGroups = [...currentGroups, newGroup];
      await saveGroups(updatedGroups);

      // Reset form
      setNewGroupName("");
      setSelectedMembers([]);
      setErrors({});
      setShowCreateGroup(false);

      Alert.alert("Success", "Group created successfully!");
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group");
    }
  };

  // Edit group
  const editGroup = async () => {
    if (!validateGroupForm()) {
      return;
    }

    try {
      const currentGroups = Array.isArray(groups) ? groups : [];
      const updatedGroups = currentGroups.map((group) =>
        group && editingGroup && group.id === editingGroup.id
          ? {
              ...group,
              name: newGroupName.trim(),
              members: Array.isArray(selectedMembers)
                ? [...selectedMembers]
                : [],
            }
          : group
      );

      await saveGroups(updatedGroups);

      // Reset form
      setNewGroupName("");
      setSelectedMembers([]);
      setEditingGroup(null);
      setErrors({});
      setShowEditGroup(false);

      Alert.alert("Success", "Group updated successfully!");
    } catch (error) {
      console.error("Error editing group:", error);
      Alert.alert("Error", "Failed to update group");
    }
  };

  // Delete group
  const deleteGroup = (groupId) => {
    if (!groups || !Array.isArray(groups)) return;

    const group = groups.find((g) => g && g.id === groupId);
    if (!group) return;

    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${group.name || "this group"}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedGroups = groups.filter((g) => g && g.id !== groupId);
              await saveGroups(updatedGroups);
            } catch (error) {
              Alert.alert("Error", "Failed to delete group");
            }
          },
        },
      ]
    );
  };

  // Handle edit group setup
  const handleEditGroup = (group) => {
    if (!group) return;

    setEditingGroup(group);
    setNewGroupName(group.name || "");
    setSelectedMembers(
      group.members && Array.isArray(group.members) ? [...group.members] : []
    );
    setShowEditGroup(true);
  };

  // Add bill to group
  const addBillToGroup = async () => {
    if (
      !billDescription.trim() ||
      !billAmount ||
      !billPaidBy ||
      !billSplitWith.length
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      const newBill = {
        id: Date.now(),
        description: billDescription.trim(),
        amount: parseFloat(billAmount),
        paidBy: billPaidBy,
        splitWith: Array.isArray(billSplitWith) ? [...billSplitWith] : [],
        date: new Date().toISOString(),
        settled: false,
        groupId: selectedGroup ? selectedGroup.id : null,
      };

      const currentGroups = Array.isArray(groups) ? groups : [];
      const updatedGroups = currentGroups.map((group) => {
        if (group && selectedGroup && group.id === selectedGroup.id) {
          return {
            ...group,
            bills: Array.isArray(group.bills)
              ? [...group.bills, newBill]
              : [newBill],
          };
        }
        return group;
      });

      await saveGroups(updatedGroups);

      // Update selected group
      const updatedSelectedGroup = updatedGroups.find(
        (g) => g && selectedGroup && g.id === selectedGroup.id
      );
      if (updatedSelectedGroup) {
        setSelectedGroup(updatedSelectedGroup);
      }

      // Reset form
      setBillDescription("");
      setBillAmount("");
      setBillPaidBy("");
      setBillSplitWith([]);
      setShowAddBill(false);

      Alert.alert("Success", "Bill added successfully!");
    } catch (error) {
      console.error("Error adding bill:", error);
      Alert.alert("Error", "Failed to add bill");
    }
  };

  // Settlement
  const settleUp = async () => {
    if (!settleFromMember || !settleToMember || !settleAmount) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      const settlement = {
        id: Date.now(),
        from: settleFromMember,
        to: settleToMember,
        amount: amount,
        date: new Date().toISOString(),
      };

      const currentGroups = Array.isArray(groups) ? groups : [];
      const updatedGroups = currentGroups.map((group) => {
        if (group && selectedGroup && group.id === selectedGroup.id) {
          return {
            ...group,
            settlements: Array.isArray(group.settlements)
              ? [...group.settlements, settlement]
              : [settlement],
          };
        }
        return group;
      });

      await saveGroups(updatedGroups);

      const updatedSelectedGroup = updatedGroups.find(
        (g) => g && selectedGroup && g.id === selectedGroup.id
      );
      if (updatedSelectedGroup) {
        setSelectedGroup(updatedSelectedGroup);
      }

      // Reset form
      setSettleFromMember("");
      setSettleToMember("");
      setSettleAmount("");
      setShowSettleUp(false);

      Alert.alert("Success", "Settlement recorded successfully!");
    } catch (error) {
      console.error("Error settling up:", error);
      Alert.alert("Error", "Failed to record settlement");
    }
  };

  // Group Card Component
  const GroupCard = ({ group }) => {
    if (!group) return null;

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => setSelectedGroup(group)}
        activeOpacity={0.7}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupTitleContainer}>
            <Text style={styles.groupName}>
              {group.name || "Unnamed Group"}
            </Text>
            <Text style={styles.memberCount}>
              {group.members && Array.isArray(group.members)
                ? group.members.length
                : 0}{" "}
              members
            </Text>
          </View>
          <View style={styles.groupActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEditGroup(group);
              }}
            >
              <Text style={styles.buttonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                deleteGroup(group.id);
              }}
            >
              <Text style={styles.buttonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.groupInfo}>
          <Text style={styles.membersText}>
            {group.members && Array.isArray(group.members)
              ? group.members.join(", ")
              : "No members"}
          </Text>
          <Text style={styles.billCount}>
            {group.bills && Array.isArray(group.bills) ? group.bills.length : 0}{" "}
            bills
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateGroup(true)}
          >
            <Text style={styles.addButtonText}>+ New Group</Text>
          </TouchableOpacity>
        </View>

        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first group to start splitting bills with friends
            </Text>
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={({ item }) => <GroupCard group={item} />}
            keyExtractor={(item) =>
              item && item.id ? item.id.toString() : Math.random().toString()
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#8B4513"]}
                tintColor="#8B4513"
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Create Group Modal */}
        <Modal
          visible={showCreateGroup}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateGroup(false);
                    setErrors({});
                    setNewGroupName("");
                    setSelectedMembers([]);
                  }}
                >
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Create Group</Text>
                <TouchableOpacity onPress={createGroup}>
                  <Text style={styles.saveButton}>Create</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Group Name *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.groupName && styles.inputError,
                    ]}
                    value={newGroupName}
                    onChangeText={setNewGroupName}
                    placeholder="Enter group name"
                    maxLength={30}
                  />
                  {errors.groupName && (
                    <Text style={styles.errorText}>{errors.groupName}</Text>
                  )}
                </View>

                <View
                  style={[
                    styles.inputGroup,
                    { zIndex: membersDropdownOpen ? 5000 : 1 },
                  ]}
                >
                  <Text style={styles.label}>Add Members *</Text>
                  {friendsDropdownOptions.length === 0 ? (
                    <View style={styles.noFriendsContainer}>
                      <Text style={styles.noFriendsText}>
                        No friends available. Please add friends first.
                      </Text>
                    </View>
                  ) : (
                    <DropDownPicker
                      open={membersDropdownOpen}
                      value={selectedMembers}
                      items={friendsDropdownOptions}
                      setOpen={setMembersDropdownOpen}
                      setValue={setSelectedMembers}
                      placeholder="Select friends to add"
                      multiple={true}
                      mode="BADGE"
                      style={[
                        styles.dropdown,
                        errors.members && styles.inputError,
                      ]}
                      dropDownContainerStyle={styles.dropdownContainer}
                      zIndex={5000}
                      maxHeight={200}
                    />
                  )}
                  {errors.members && (
                    <Text style={styles.errorText}>{errors.members}</Text>
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Edit Group Modal */}
        <Modal
          visible={showEditGroup}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowEditGroup(false);
                    setEditingGroup(null);
                    setErrors({});
                    setNewGroupName("");
                    setSelectedMembers([]);
                  }}
                >
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Group</Text>
                <TouchableOpacity onPress={editGroup}>
                  <Text style={styles.saveButton}>Save</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Group Name *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.groupName && styles.inputError,
                    ]}
                    value={newGroupName}
                    onChangeText={setNewGroupName}
                    placeholder="Enter group name"
                    maxLength={30}
                  />
                  {errors.groupName && (
                    <Text style={styles.errorText}>{errors.groupName}</Text>
                  )}
                </View>

                <View
                  style={[
                    styles.inputGroup,
                    { zIndex: membersDropdownOpen ? 5000 : 1 },
                  ]}
                >
                  <Text style={styles.label}>Members *</Text>
                  {friendsDropdownOptions.length === 0 ? (
                    <View style={styles.noFriendsContainer}>
                      <Text style={styles.noFriendsText}>
                        No friends available. Please add friends first.
                      </Text>
                    </View>
                  ) : (
                    <DropDownPicker
                      open={membersDropdownOpen}
                      value={selectedMembers}
                      items={friendsDropdownOptions}
                      setOpen={setMembersDropdownOpen}
                      setValue={setSelectedMembers}
                      placeholder="Select friends"
                      multiple={true}
                      mode="BADGE"
                      style={[
                        styles.dropdown,
                        errors.members && styles.inputError,
                      ]}
                      dropDownContainerStyle={styles.dropdownContainer}
                      zIndex={5000}
                      maxHeight={200}
                    />
                  )}
                  {errors.members && (
                    <Text style={styles.errorText}>{errors.members}</Text>
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Group Details Modal */}
        <Modal
          visible={selectedGroup !== null}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedGroup(null)}>
                  <Text style={styles.cancelButton}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {selectedGroup?.name || "Group Details"}
                </Text>
                <TouchableOpacity onPress={() => setShowAddBill(true)}>
                  <Text style={styles.addBillButton}>+ Add Bill</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Members</Text>
                    <TouchableOpacity
                      style={styles.settleButton}
                      onPress={() => setShowSettleUp(true)}
                    >
                      <Text style={styles.settleButtonText}>Settle Up</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedGroup?.members &&
                  Array.isArray(selectedGroup.members) ? (
                    selectedGroup.members.map((member, index) => (
                      <View key={index} style={styles.memberItem}>
                        <Text style={styles.memberName}>{member}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noData}>No members in this group</Text>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Bills (
                    {selectedGroup?.bills && Array.isArray(selectedGroup.bills)
                      ? selectedGroup.bills.length
                      : 0}
                    )
                  </Text>
                  {!selectedGroup?.bills ||
                  !Array.isArray(selectedGroup.bills) ||
                  selectedGroup.bills.length === 0 ? (
                    <Text style={styles.noData}>
                      No bills yet. Add your first bill!
                    </Text>
                  ) : (
                    selectedGroup.bills
                      .slice()
                      .reverse()
                      .map((bill) => (
                        <View
                          key={bill?.id || Math.random()}
                          style={styles.billItem}
                        >
                          <Text style={styles.billDescription}>
                            {bill?.description || "Unnamed Bill"}
                          </Text>
                          <Text style={styles.billAmount}>
                            ${bill?.amount ? bill.amount.toFixed(2) : "0.00"}
                          </Text>
                          <Text style={styles.billDetails}>
                            Paid by: {bill?.paidBy || "Unknown"}
                          </Text>
                        </View>
                      ))
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Add Bill Modal */}
        <Modal
          visible={showAddBill}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowAddBill(false)}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add Bill</Text>
                <TouchableOpacity onPress={addBillToGroup}>
                  <Text style={styles.saveButton}>Add</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description *</Text>
                  <TextInput
                    style={styles.input}
                    value={billDescription}
                    onChangeText={setBillDescription}
                    placeholder="What's this bill for?"
                    maxLength={50}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Amount *</Text>
                  <TextInput
                    style={styles.input}
                    value={billAmount}
                    onChangeText={setBillAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    maxLength={10}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Paid by *</Text>
                  <View style={styles.memberSelector}>
                    {selectedGroup?.members &&
                    Array.isArray(selectedGroup.members) ? (
                      selectedGroup.members.map((member) => (
                        <TouchableOpacity
                          key={member}
                          style={[
                            styles.memberOption,
                            billPaidBy === member &&
                              styles.selectedMemberOption,
                          ]}
                          onPress={() => setBillPaidBy(member)}
                        >
                          <Text
                            style={[
                              styles.memberOptionText,
                              billPaidBy === member &&
                                styles.selectedMemberOptionText,
                            ]}
                          >
                            {member}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noData}>No members available</Text>
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Split between *</Text>
                  <View style={styles.memberSelector}>
                    {selectedGroup?.members &&
                    Array.isArray(selectedGroup.members) ? (
                      selectedGroup.members.map((member) => (
                        <TouchableOpacity
                          key={member}
                          style={[
                            styles.memberOption,
                            billSplitWith.includes(member) &&
                              styles.selectedMemberOption,
                          ]}
                          onPress={() => {
                            if (billSplitWith.includes(member)) {
                              setBillSplitWith(
                                billSplitWith.filter((m) => m !== member)
                              );
                            } else {
                              setBillSplitWith([...billSplitWith, member]);
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.memberOptionText,
                              billSplitWith.includes(member) &&
                                styles.selectedMemberOptionText,
                            ]}
                          >
                            {member}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noData}>No members available</Text>
                    )}
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Settle Up Modal */}
        <Modal
          visible={showSettleUp}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowSettleUp(false)}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Settle Up</Text>
                <TouchableOpacity onPress={settleUp}>
                  <Text style={styles.saveButton}>Settle</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>From (who paid)</Text>
                  <View style={styles.memberSelector}>
                    {selectedGroup?.members &&
                    Array.isArray(selectedGroup.members) ? (
                      selectedGroup.members.map((member) => (
                        <TouchableOpacity
                          key={member}
                          style={[
                            styles.memberOption,
                            settleFromMember === member &&
                              styles.selectedMemberOption,
                          ]}
                          onPress={() => setSettleFromMember(member)}
                        >
                          <Text
                            style={[
                              styles.memberOptionText,
                              settleFromMember === member &&
                                styles.selectedMemberOptionText,
                            ]}
                          >
                            {member}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noData}>No members available</Text>
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>To (who received)</Text>
                  <View style={styles.memberSelector}>
                    {selectedGroup?.members &&
                    Array.isArray(selectedGroup.members) ? (
                      selectedGroup.members.map((member) => (
                        <TouchableOpacity
                          key={member}
                          style={[
                            styles.memberOption,
                            settleToMember === member &&
                              styles.selectedMemberOption,
                          ]}
                          onPress={() => setSettleToMember(member)}
                        >
                          <Text
                            style={[
                              styles.memberOptionText,
                              settleToMember === member &&
                                styles.selectedMemberOptionText,
                            ]}
                          >
                            {member}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noData}>No members available</Text>
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Amount</Text>
                  <TextInput
                    style={styles.input}
                    value={settleAmount}
                    onChangeText={setSettleAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>
              </ScrollView>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#EFE4D2",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D4C4A8",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  addButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  listContent: {
    padding: 20,
  },
  groupCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  groupTitleContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 12,
    color: "#8B4513",
    fontWeight: "600",
  },
  groupActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#FFEBEE",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
  },
  groupInfo: {
    gap: 8,
  },
  membersText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  billCount: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#EFE4D2",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D4C4A8",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  cancelButton: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  saveButton: {
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "700",
  },
  addBillButton: {
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "700",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#D4C4A8",
  },
  inputError: {
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: 6,
  },
  dropdown: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4C4A8",
  },
  dropdownContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4C4A8",
  },
  noFriendsContainer: {
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  noFriendsText: {
    color: "#856404",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  settleButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  settleButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  memberItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  memberName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  noData: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  billItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  billDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 4,
  },
  billDetails: {
    fontSize: 14,
    color: "#666",
  },
  memberSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  memberOption: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#D4C4A8",
  },
  selectedMemberOption: {
    backgroundColor: "#8B4513",
    borderColor: "#8B4513",
  },
  memberOptionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  selectedMemberOptionText: {
    color: "white",
  },
};
