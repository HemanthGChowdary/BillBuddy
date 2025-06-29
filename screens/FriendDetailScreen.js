import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCurrencySymbol } from "../utils/helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function FriendDetailScreen({
  route,
  navigation,
  bills,
  profileName,
  profileEmoji,
  friends,
  darkMode = false, // Add darkMode prop
}) {
  const { friendName } = route.params;
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [settlements, setSettlements] = useState([]);

  const currentUser = profileName?.trim();
  const isOwnProfile = friendName === currentUser;

  // Load settlements on component mount
  useEffect(() => {
    loadSettlements();
  }, [friendName]);

  const loadSettlements = async () => {
    try {
      const saved = await AsyncStorage.getItem(`settlements_${friendName}`);
      if (saved) {
        setSettlements(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load settlements:", error);
    }
  };

  const saveSettlement = async (newSettlement) => {
    try {
      const updatedSettlements = [newSettlement, ...settlements];
      setSettlements(updatedSettlements);
      await AsyncStorage.setItem(
        `settlements_${friendName}`,
        JSON.stringify(updatedSettlements)
      );
    } catch (error) {
      console.error("Failed to save settlement:", error);
    }
  };

  const [youOweFriend, setYouOweFriend] = useState(0);
  const [friendOwesYou, setFriendOwesYou] = useState(0);
  const [friendOwesOthers, setFriendOwesOthers] = useState(0); // New state for friend owing others
  const [othersOweFriend, setOthersOweFriend] = useState(0); // New state for others owing friend
  const [currency, setCurrency] = useState("USD");

  const [
    friendNetBalanceWithSpecificOthers,
    setFriendNetBalanceWithSpecificOthers,
  ] = useState({});

  useEffect(() => {
    let currentYouOweFriend = 0;
    let currentFriendOwesYou = 0;
    let totalFriendOwesOthers = 0;
    let totalOthersOweFriend = 0;

    // A temporary map to track the net balance of 'friendName' with each 'other' person.
    // Positive value means 'other' owes 'friendName'.
    // Negative value means 'friendName' owes 'other'.
    const friendNetBalanceWithSpecificOthers = {};

    bills.forEach((bill) => {
      const { payer, splitWith = [], currency: billCurrency } = bill;

      // Skip bills where friendName is not involved
      const isFriendInvolved =
        payer === friendName || splitWith.includes(friendName);
      if (!isFriendInvolved) return;

      // Set currency based on first matching bill
      if (billCurrency && currency !== billCurrency) {
        setCurrency(billCurrency);
      }

      const totalAmount = parseFloat(bill.amount);
      const numParticipants = splitWith.length;
      const share = numParticipants > 0 ? totalAmount / numParticipants : 0;

      // --- Calculate You vs. Friend (Existing Logic) ---
      if (payer === currentUser) {
        if (splitWith.includes(friendName) && friendName !== currentUser) {
          currentFriendOwesYou += share; // Friend owes you
        }
      } else if (payer === friendName) {
        if (splitWith.includes(currentUser) && currentUser !== friendName) {
          currentYouOweFriend += share; // You owe friend
        }
      }

      // --- Calculate Friend vs. Others ---
      // We are looking for bills where the selected friend (friendName)
      // interacts financially with anyone *other* than 'currentUser' or 'friendName' themselves.

      splitWith.forEach((participant) => {
        // Skip current user and the friend being detailed, as their balances are separate.
        if (participant === currentUser || participant === friendName) {
          return;
        }

        // If the selected friend (friendName) paid the bill, and 'participant' is in the split
        if (payer === friendName) {
          // This 'participant' (an 'other') owes 'friendName'
          friendNetBalanceWithSpecificOthers[participant] =
            (friendNetBalanceWithSpecificOthers[participant] || 0) + share;
        }
        // If 'participant' (an 'other') paid the bill, and the selected friend (friendName) is in the split
        else if (payer === participant) {
          // 'friendName' owes this 'participant' (an 'other')
          friendNetBalanceWithSpecificOthers[participant] =
            (friendNetBalanceWithSpecificOthers[participant] || 0) - share;
        }
        // If a third, completely different person paid (neither friendName nor participant)
        // and both friendName and participant are in the split, their debt is to the payer.
        // This specific transaction doesn't create a direct debt between friendName and 'participant'
        // that needs to be settled on this summary.
      });
    });

    // Netting for You vs. Friend
    if (currentYouOweFriend > currentFriendOwesYou) {
      setYouOweFriend(currentYouOweFriend - currentFriendOwesYou);
      setFriendOwesYou(0);
    } else {
      setFriendOwesYou(currentFriendOwesYou - currentYouOweFriend);
      setYouOweFriend(0);
    }

    // Aggregate Friend vs. Others
    for (const otherPerson in friendNetBalanceWithSpecificOthers) {
      const netAmount = friendNetBalanceWithSpecificOthers[otherPerson];
      if (netAmount < 0) {
        // friendName owes this other person
        totalFriendOwesOthers += Math.abs(netAmount);
      } else if (netAmount > 0) {
        // This other person owes friendName
        totalOthersOweFriend += netAmount;
      }
    }

    setFriendOwesOthers(totalFriendOwesOthers);
    setOthersOweFriend(totalOthersOweFriend);
    setFriendNetBalanceWithSpecificOthers(friendNetBalanceWithSpecificOthers);
  }, [bills, friendName, currentUser, friends, currency]); // Added 'friends' and 'currency' to dependency array

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  // Get friend emoji - use profileEmoji if viewing own profile
  const friendData = friends.find((f) => f.name === friendName);
  const friendEmoji = isOwnProfile
    ? profileEmoji || "👤"
    : friendData?.emoji || "👤";

  const netBalance = friendOwesYou - youOweFriend;

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, darkMode && styles.darkHeader]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: darkMode ? "#4A5568" : "#F3F4F6",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 16,
            }}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={darkMode ? "#E2E8F0" : "#374151"}
            />
          </TouchableOpacity>

          <View style={{ position: "relative" }}>
            <View
              style={[styles.friendAvatar, darkMode && styles.darkFriendAvatar]}
            >
              <Text style={styles.friendEmoji}>{friendEmoji}</Text>
            </View>
            {/* Status Indicator */}
            <View
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#4CAF50", // Always online for demo
                borderWidth: 3,
                borderColor: darkMode ? "#2D3748" : "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 3,
              }}
            />
          </View>

          <View style={[styles.headerTextContainer, { marginLeft: 16 }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Text
                style={[
                  styles.friendName,
                  darkMode && styles.darkFriendName,
                  { flex: 1 },
                ]}
              >
                {friendName}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#4CAF50",
                  fontWeight: "500",
                  marginLeft: 8,
                }}
              >
                Online
              </Text>
            </View>
            <Text
              style={[
                styles.balanceStatus,
                {
                  color:
                    netBalance > 0
                      ? "#4CAF50"
                      : netBalance < 0
                      ? "#F44336"
                      : darkMode
                      ? "#CBD5E0"
                      : "#666",
                },
              ]}
            >
              {isOwnProfile
                ? netBalance === 0
                  ? "All settled up"
                  : `Total balance: ${currencySymbol}${Math.abs(
                      netBalance
                    ).toFixed(2)}`
                : netBalance > 0
                ? `Owes ${
                    currentUser || "you"
                  } ${currencySymbol}${netBalance.toFixed(2)}`
                : netBalance < 0
                ? `${currentUser || "You"} owes ${currencySymbol}${Math.abs(
                    netBalance
                  ).toFixed(2)}`
                : "Settled up"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Overview */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}
          >
            Balance Overview
          </Text>

          <View
            style={[styles.balanceCard, darkMode && styles.darkBalanceCard]}
          >
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text
                  style={[
                    styles.balanceLabel,
                    darkMode && styles.darkBalanceLabel,
                  ]}
                >
                  {isOwnProfile
                    ? `${currentUser || "You"} owe friends`
                    : `${currentUser || "You"} owe ${friendName}`}
                </Text>
                <Text style={[styles.balanceAmount, { color: "#F44336" }]}>
                  {currencySymbol}
                  {youOweFriend.toFixed(2)}
                </Text>
              </View>

              <View style={styles.balanceItem}>
                <Text
                  style={[
                    styles.balanceLabel,
                    darkMode && styles.darkBalanceLabel,
                  ]}
                >
                  {isOwnProfile
                    ? `Friends owe ${currentUser || "you"}`
                    : `${friendName} owes ${currentUser || "you"}`}
                </Text>
                <Text style={[styles.balanceAmount, { color: "#4CAF50" }]}>
                  {currencySymbol}
                  {friendOwesYou.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, darkMode && styles.darkDivider]} />

            <View style={styles.netBalanceRow}>
              <Text
                style={[
                  styles.netBalanceLabel,
                  darkMode && styles.darkNetBalanceLabel,
                ]}
              >
                Net Balance
              </Text>
              <Text
                style={[
                  styles.netBalanceAmount,
                  {
                    color:
                      netBalance > 0
                        ? "#4CAF50"
                        : netBalance < 0
                        ? "#F44336"
                        : darkMode
                        ? "#CBD5E0"
                        : "#666",
                  },
                ]}
              >
                {netBalance > 0 ? "+" : ""}
                {currencySymbol}
                {netBalance.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Other Relationships */}
        {(friendOwesOthers > 0 || othersOweFriend > 0) && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}
            >
              {isOwnProfile
                ? `${currentUser || "Your"} Other Balances`
                : `${friendName}'s Other Balances`}
            </Text>

            <View
              style={[
                styles.otherBalancesCard,
                darkMode && styles.darkOtherBalancesCard,
              ]}
            >
              {friendOwesOthers > 0 && (
                <View style={styles.otherBalanceSection}>
                  <View style={styles.otherBalanceRow}>
                    <View style={styles.otherBalanceIcon}>
                      <Ionicons name="arrow-up" size={16} color="#F44336" />
                    </View>
                    <View style={styles.otherBalanceContent}>
                      <Text
                        style={[
                          styles.otherBalanceLabel,
                          darkMode && styles.darkOtherBalanceLabel,
                        ]}
                      >
                        {isOwnProfile
                          ? `${currentUser || "You"} owes others`
                          : `${friendName} owes others`}
                      </Text>
                      <Text
                        style={[
                          styles.otherBalanceAmount,
                          { color: "#F44336" },
                        ]}
                      >
                        {currencySymbol}
                        {friendOwesOthers.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  {/* Individual breakdown */}
                  <View style={styles.individualBreakdown}>
                    {Object.entries(friendNetBalanceWithSpecificOthers || {})
                      .filter(([, balance]) => balance < 0)
                      .map(([personName, balance]) => (
                        <Text
                          key={personName}
                          style={[
                            styles.individualItem,
                            darkMode && styles.darkIndividualItem,
                          ]}
                        >
                          • {personName}: {currencySymbol}
                          {Math.abs(balance).toFixed(2)}
                        </Text>
                      ))}
                  </View>
                </View>
              )}

              {othersOweFriend > 0 && (
                <View style={styles.otherBalanceSection}>
                  <View style={styles.otherBalanceRow}>
                    <View style={styles.otherBalanceIcon}>
                      <Ionicons name="arrow-down" size={16} color="#4CAF50" />
                    </View>
                    <View style={styles.otherBalanceContent}>
                      <Text
                        style={[
                          styles.otherBalanceLabel,
                          darkMode && styles.darkOtherBalanceLabel,
                        ]}
                      >
                        {isOwnProfile
                          ? `Others owe ${currentUser || "you"}`
                          : `Others owe ${friendName}`}
                      </Text>
                      <Text
                        style={[
                          styles.otherBalanceAmount,
                          { color: "#4CAF50" },
                        ]}
                      >
                        {currencySymbol}
                        {othersOweFriend.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  {/* Individual breakdown */}
                  <View style={styles.individualBreakdown}>
                    {Object.entries(friendNetBalanceWithSpecificOthers || {})
                      .filter(([, balance]) => balance > 0)
                      .map(([personName, balance]) => (
                        <Text
                          key={personName}
                          style={[
                            styles.individualItem,
                            darkMode && styles.darkIndividualItem,
                          ]}
                        >
                          • {personName}: {currencySymbol}
                          {balance.toFixed(2)}
                        </Text>
                      ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Settlement History */}
        {settlements.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}
            >
              Settlement History
            </Text>

            {settlements.slice(0, 5).map((settlement) => (
              <View
                key={settlement.id}
                style={[
                  styles.settlementCard,
                  darkMode && styles.darkSettlementCard,
                ]}
              >
                <View style={styles.settlementHeader}>
                  <View style={styles.settlementIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#4CAF50"
                    />
                  </View>
                  <View style={styles.settlementContent}>
                    <Text
                      style={[
                        styles.settlementAmount,
                        darkMode && styles.darkSettlementText,
                      ]}
                    >
                      {currencySymbol}
                      {settlement.amount.toFixed(2)} settled
                    </Text>
                    <Text
                      style={[
                        styles.settlementDate,
                        darkMode && styles.darkSettlementDate,
                      ]}
                    >
                      {new Date(settlement.date).toLocaleDateString()} at{" "}
                      {new Date(settlement.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.settlementNote,
                        darkMode && styles.darkSettlementNote,
                      ]}
                    >
                      Payment method: {settlement.note}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {settlements.length > 5 && (
              <Text
                style={[
                  styles.moreSettlements,
                  darkMode && styles.darkMoreSettlements,
                ]}
              >
                +{settlements.length - 5} more settlements
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!isOwnProfile && netBalance !== 0 && (
        <View
          style={[
            styles.actionContainer,
            darkMode && styles.darkActionContainer,
          ]}
        >
          <TouchableOpacity
            style={[styles.settleButton, darkMode && styles.darkSettleButton]}
            onPress={() => setShowSettleModal(true)}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.settleButtonText}>Settle Up</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Settle Up Modal */}
      <Modal
        visible={showSettleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettleModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.modalContent,
                  darkMode && styles.darkModalContent,
                ]}
              >
                <Text
                  style={[styles.modalTitle, darkMode && styles.darkModalTitle]}
                >
                  Settle Up with {friendName}
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    darkMode && styles.darkModalSubtitle,
                  ]}
                >
                  Current balance: {currencySymbol}
                  {Math.abs(netBalance).toFixed(2)}
                </Text>

                <TextInput
                  style={[
                    styles.settleInput,
                    darkMode && styles.darkSettleInput,
                    { marginBottom: 16 },
                  ]}
                  placeholder="Enter amount to settle"
                  placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                  value={settleAmount}
                  onChangeText={setSettleAmount}
                  keyboardType="numeric"
                />

                <TextInput
                  style={[
                    styles.settleInput,
                    darkMode && styles.darkSettleInput,
                    { marginBottom: 20 },
                  ]}
                  placeholder="Enter mode of payment"
                  placeholderTextColor={darkMode ? "#A0AEC0" : "#999"}
                  value={settleNote}
                  onChangeText={setSettleNote}
                  multiline
                  numberOfLines={2}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowSettleModal(false);
                      setSettleAmount("");
                      setSettleNote("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      [
                        styles.confirmButton,
                        darkMode && styles.darkconfirmButton,
                      ],
                    ]}
                    onPress={() => {
                      const amount = parseFloat(settleAmount);
                      if (isNaN(amount) || amount <= 0) {
                        Alert.alert(
                          "Invalid Amount",
                          "Please enter a valid amount"
                        );
                        return;
                      }
                      if (amount > Math.abs(netBalance)) {
                        Alert.alert(
                          "Amount Too High",
                          `Amount cannot exceed ${currencySymbol}${Math.abs(
                            netBalance
                          ).toFixed(2)}`
                        );
                        return;
                      }

                      const settlement = {
                        id: `settle_${Date.now()}_${Math.random()}`,
                        amount: amount,
                        note:
                          settleNote.trim() || "No payment method specified",
                        date: new Date().toISOString(),
                        friendName: friendName,
                        settledBy: currentUser || "Unknown User",
                      };

                      Alert.alert(
                        "Settle Up",
                        `Record ${currencySymbol}${amount.toFixed(
                          2
                        )} settlement with ${friendName}?\n\nPayment method: ${
                          settlement.note
                        }`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Confirm",
                            onPress: async () => {
                              await saveSettlement(settlement);

                              // TODO: Update actual bill balances here
                              // This would typically involve updating the bills state
                              // to reflect the settlement and recalculate balances

                              Alert.alert(
                                "Success",
                                `Settlement of ${currencySymbol}${amount.toFixed(
                                  2
                                )} recorded!`
                              );
                              setShowSettleModal(false);
                              setSettleAmount("");
                              setSettleNote("");
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.confirmButtonText}>Settle Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: "#EFE4D2",
  },
  darkContainer: {
    backgroundColor: "#1A1A1A",
  },

  // Header
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  darkHeader: {
    backgroundColor: "#2D3748",
    borderBottomColor: "#4A5568",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFE4D2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D69E2E",
  },
  darkFriendAvatar: {
    backgroundColor: "#4A5568",
    borderColor: "#D69E2E",
  },
  friendEmoji: {
    fontSize: 32,
  },
  headerTextContainer: {
    flex: 1,
  },
  friendName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B4513", // Brown theme
    marginBottom: 4,
  },
  darkFriendName: {
    color: "#D69E2E", // Gold in dark mode
  },
  balanceStatus: {
    fontSize: 16,
    fontWeight: "500",
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
    padding: 20,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  darkSectionTitle: {
    color: "#FFFFFF",
  },

  // Balance Card
  balanceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkBalanceCard: {
    backgroundColor: "#2D3748",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  balanceItem: {
    flex: 1,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    textAlign: "center",
  },
  darkBalanceLabel: {
    color: "#CBD5E0",
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  darkDivider: {
    backgroundColor: "#4A5568",
  },
  netBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netBalanceLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  darkNetBalanceLabel: {
    color: "#FFFFFF",
  },
  netBalanceAmount: {
    fontSize: 24,
    fontWeight: "800",
  },

  // Other Balances Card
  otherBalancesCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  darkOtherBalancesCard: {
    backgroundColor: "#1A202C",
    borderColor: "#4A5568",
  },
  otherBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 40,
  },
  otherBalanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  otherBalanceContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 8,
  },
  otherBalanceLabel: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
    marginRight: 24,
  },
  darkOtherBalanceLabel: {
    color: "#FFFFFF",
  },
  otherBalanceAmount: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    minWidth: 80,
  },

  // Action Container
  actionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  darkActionContainer: {
    backgroundColor: "#2D3748",
    borderTopColor: "#4A5568",
  },
  settleButton: {
    backgroundColor: "#8B4513", // Brown theme
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkSettleButton: {
    backgroundColor: "#D69E2E", // Gold in dark mode
  },
  settleButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  darkModalContent: {
    backgroundColor: "#2D3748",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
  },
  darkModalTitle: {
    color: "#FFFFFF",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  darkModalSubtitle: {
    color: "#CBD5E0",
  },
  settleInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#374151",
    backgroundColor: "#F9FAFB",
    textAlign: "center",
  },
  darkSettleInput: {
    borderColor: "#4A5568",
    backgroundColor: "#1A202C",
    color: "#FFFFFF",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#8B4513",
  },
  darkconfirmButton: {
    backgroundColor: "#D69E2E", // Gold in dark mode
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Settlement History Styles
  settlementCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  darkSettlementCard: {
    backgroundColor: "#1A202C",
    borderColor: "#4A5568",
  },
  settlementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  settlementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settlementContent: {
    flex: 1,
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  darkSettlementText: {
    color: "#FFFFFF",
  },
  settlementDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  darkSettlementDate: {
    color: "#A0AEC0",
  },
  settlementNote: {
    fontSize: 12,
    color: "#4B5563",
    fontStyle: "italic",
    marginTop: 2,
  },
  darkSettlementNote: {
    color: "#CBD5E0",
  },
  moreSettlements: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 8,
  },
  darkMoreSettlements: {
    color: "#A0AEC0",
  },

  // Individual breakdown styles
  otherBalanceSection: {
    marginBottom: 16,
  },
  individualBreakdown: {
    marginTop: 8,
    marginLeft: 44, // Align with the content above
  },
  individualItem: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  darkIndividualItem: {
    color: "#A0AEC0",
  },
});
