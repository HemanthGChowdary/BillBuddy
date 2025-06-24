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
  Keyboard,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Add this for the clear icon
import DropDownPicker from "react-native-dropdown-picker";
import {
  getFriendsDropdownOptions,
  currencyOptions,
  getCurrencySymbol,
} from "../utils/helpers";

// Extracted Bill Item Component for better performance
const BillItem = React.memo(({ item, onEdit, onDelete }) => {
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

  return (
    <View style={styles.billItem}>
      <View style={styles.billHeader}>
        <Text style={styles.billName}>{item.name}</Text>
        <Text style={styles.billDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.billAmount}>
        {formatAmount(item.amount, item.currency)}
      </Text>

      <Text style={styles.billPayer}>Paid by {item.payer}</Text>

      {item.splitWith && item.splitWith.length > 0 && (
        <Text style={styles.billSplit}>
          Split with: {item.splitWith.join(", ")}
        </Text>
      )}

      {item.note && <Text style={styles.billNote}>{item.note}</Text>}

      <View style={styles.billActions}>
        <Pressable
          onPress={() => onEdit(item)}
          style={[styles.actionButton, styles.editButton]}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => onDelete(item)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
});

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
  payerDropdownOpen,
  setPayerDropdownOpen,
  splitDropdownOpen,
  setSplitDropdownOpen,
  currencyDropdownOpen,
  setCurrencyDropdownOpen,
  fullFriendsList,
  onSave,
  onCancel,
  isLoading,
}) => {
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!editBillData?.name?.trim()) {
      newErrors.name = "Expense name is required";
    }

    const amount = parseFloat(editBillData?.amount);
    if (!editBillData?.amount?.trim() || isNaN(amount) || amount <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!payer) {
      newErrors.payer = "Please select who paid";
    }

    if (!splitWith || splitWith.length === 0) {
      newErrors.splitWith = "Please select at least one person to split with";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <Text style={styles.modalTitle}>Edit Bill</Text>

              <TextInput
                placeholder="Expense Name"
                value={editBillData?.name || ""}
                onChangeText={(txt) => {
                  setEditBillData((prev) => ({ ...prev, name: txt }));
                  if (errors.name)
                    setErrors((prev) => ({ ...prev, name: null }));
                }}
                style={[styles.textInput, errors.name && styles.inputError]}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              <TextInput
                placeholder="Amount"
                keyboardType="numeric"
                value={editBillData?.amount || ""}
                onChangeText={(txt) => {
                  setEditBillData((prev) => ({ ...prev, amount: txt }));
                  if (errors.amount)
                    setErrors((prev) => ({ ...prev, amount: null }));
                }}
                style={[styles.textInput, errors.amount && styles.inputError]}
              />
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}

              <DropDownPicker
                placeholder="Currency"
                open={currencyDropdownOpen}
                value={currency}
                items={currencyOptions}
                setOpen={setCurrencyDropdownOpen}
                setValue={setCurrency}
                setItems={() => {}}
                zIndex={3000}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
              />

              <TextInput
                placeholder="Note (optional)"
                value={note}
                onChangeText={setNote}
                style={styles.textInput}
                multiline
                numberOfLines={2}
              />

              <DropDownPicker
                placeholder="Who paid?"
                open={payerDropdownOpen}
                value={payer}
                items={fullFriendsList}
                setOpen={setPayerDropdownOpen}
                setValue={setPayer}
                setItems={() => {}}
                zIndex={2000}
                style={[styles.dropdown, errors.payer && styles.inputError]}
                dropDownContainerStyle={styles.dropdownContainer}
              />
              {errors.payer && (
                <Text style={styles.errorText}>{errors.payer}</Text>
              )}

              <DropDownPicker
                multiple
                min={0}
                placeholder="Split with who?"
                open={splitDropdownOpen}
                value={splitWith}
                items={fullFriendsList}
                setOpen={setSplitDropdownOpen}
                setValue={setSplitWith}
                setItems={() => {}}
                zIndex={1000}
                style={[styles.dropdown, errors.splitWith && styles.inputError]}
                dropDownContainerStyle={styles.dropdownContainer}
              />
              {errors.splitWith && (
                <Text style={styles.errorText}>{errors.splitWith}</Text>
              )}

              <View style={styles.modalActions}>
                <Pressable
                  onPress={onCancel}
                  style={[styles.modalButton, styles.cancelButton]}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[styles.modalButton, styles.saveButton]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default function HistoryScreen({
  bills,
  deleteBill,
  editBill,
  friends,
  profileName,
}) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBillData, setEditBillData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date"); // date, amount, name

  // Form states
  const [payer, setPayer] = useState(null);
  const [splitWith, setSplitWith] = useState([]);
  const [note, setNote] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [payerDropdownOpen, setPayerDropdownOpen] = useState(false);
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  const you = profileName && profileName.trim() ? profileName.trim() : "You";
  const fullFriendsList = useMemo(
    () => getFriendsDropdownOptions(friends, you),
    [friends, you]
  );

  // Enhanced filtering and sorting
  const filteredAndSortedBills = useMemo(() => {
    let filtered = bills.filter((bill) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        bill.name.toLowerCase().includes(query) ||
        bill.payer.toLowerCase().includes(query) ||
        (bill.note && bill.note.toLowerCase().includes(query)) ||
        bill.amount.toString().includes(query)
      );
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
  }, [bills, searchQuery, sortBy]);

  const openEditModal = useCallback((bill) => {
    setEditBillData(bill);
    setPayer(bill.payer || null);
    setSplitWith(bill.splitWith ? [...bill.splitWith] : []);
    setNote(bill.note || "");
    setCurrency(bill.currency || "USD");
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
      });

      // Reset form
      setEditModalVisible(false);
      setEditBillData(null);
      setPayer(null);
      setSplitWith([]);
      setNote("");
      setCurrency("USD");
    } catch (error) {
      Alert.alert("Error", "Failed to update bill. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [editBillData, payer, splitWith, note, currency, editBill]);

  const handleDelete = useCallback(
    (bill) => {
      Alert.alert(
        "Delete Bill",
        `Are you sure you want to delete "${bill.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteBill(bill.id),
          },
        ]
      );
    },
    [deleteBill]
  );

  const renderBillItem = useCallback(
    ({ item }) => (
      <BillItem item={item} onEdit={openEditModal} onDelete={handleDelete} />
    ),
    [openEditModal, handleDelete]
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No bills found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? "Try adjusting your search"
          : "Add your first bill to get started!"}
      </Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>History</Text>

        {/* Search and Sort */}
        <View style={styles.controlsContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search bills..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </Pressable>
            )}
          </View>

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <Pressable
              onPress={() =>
                setSortBy(
                  sortBy === "date"
                    ? "amount"
                    : sortBy === "amount"
                    ? "name"
                    : "date"
                )
              }
              style={styles.sortButton}
            >
              <Text style={styles.sortButtonText}>
                {sortBy === "date"
                  ? "Date"
                  : sortBy === "amount"
                  ? "Amount"
                  : "Name"}
              </Text>
            </Pressable>
          </View>
        </View>

        <FlatList
          data={filteredAndSortedBills}
          keyExtractor={(item) => item.id}
          renderItem={renderBillItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyComponent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />

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
          payerDropdownOpen={payerDropdownOpen}
          setPayerDropdownOpen={setPayerDropdownOpen}
          splitDropdownOpen={splitDropdownOpen}
          setSplitDropdownOpen={setSplitDropdownOpen}
          currencyDropdownOpen={currencyDropdownOpen}
          setCurrencyDropdownOpen={setCurrencyDropdownOpen}
          fullFriendsList={fullFriendsList}
          onSave={handleEditSave}
          onCancel={() => setEditModalVisible(false)}
          isLoading={isLoading}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFE4D2",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2356A8",
    marginBottom: 20,
    alignSelf: "center",
  },
  controlsContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    position: "relative",
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    width: 350,
    left: 20,
    padding: 12,
    paddingRight: 40, // Make space for the clear button
    fontSize: 16,
    backgroundColor: "#fff",
  },
  clearButton: {
    position: "absolute",
    right: 10,
    top: "40%",
    transform: [{ translateY: -10 }],
    padding: 5,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sortLabel: {
    fontSize: 14,
    right: 20,
    color: "#666",
    marginRight: 8,
  },
  sortButton: {
    backgroundColor: "#2356A8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    right: 22,
    borderRadius: 6,
  },
  sortButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    paddingBottom: 20,
  },
  billItem: {
    backgroundColor: "#fff",
    padding: 16,
    width: 350,
    left: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  billName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  billDate: {
    fontSize: 12,
    color: "#999",
  },
  billAmount: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2356A8",
    marginBottom: 4,
  },
  billPayer: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  billSplit: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  billNote: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#888",
    marginBottom: 8,
  },
  billActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: "#1976d2",
    width: 75,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#D32F2F",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "94%",
    maxHeight: "90%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2356A8",
    textAlign: "center",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  dropdown: {
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    minHeight: 50,
    marginBottom: 12,
  },
  dropdownContainer: {
    borderColor: "#ddd",
    borderRadius: 8,
  },
  inputError: {
    borderColor: "#D32F2F",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginBottom: 8,
    marginTop: -8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#2356A8",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
