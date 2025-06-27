import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  SafeAreaView, 
  Pressable, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCurrencySymbol } from "../utils/helpers";

export default function FriendDetailScreen({
  route,
  bills,
  profileName,
  friends,
  darkMode = false, // Add darkMode prop
}) {
  const { friendName } = route.params;

  const [youOweFriend, setYouOweFriend] = useState(0);
  const [friendOwesYou, setFriendOwesYou] = useState(0);
  const [friendOwesOthers, setFriendOwesOthers] = useState(0); // New state for friend owing others
  const [othersOweFriend, setOthersOweFriend] = useState(0); // New state for others owing friend
  const [currency, setCurrency] = useState("USD");

  const currentUser = profileName?.trim() || "You";

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
      const { payer, splitWith = [], currency: billCurrency, amount } = bill;

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
  }, [bills, friendName, currentUser, friends, currency]); // Added 'friends' and 'currency' to dependency array

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  // Get friend emoji
  const friendData = friends.find(f => f.name === friendName);
  const friendEmoji = friendData?.emoji || "👤";

  const netBalance = friendOwesYou - youOweFriend;

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, darkMode && styles.darkHeader]}>
        <View style={styles.headerContent}>
          <View style={[styles.friendAvatar, darkMode && styles.darkFriendAvatar]}>
            <Text style={styles.friendEmoji}>{friendEmoji}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.friendName, darkMode && styles.darkFriendName]}>
              {friendName}
            </Text>
            <Text style={[styles.balanceStatus, { 
              color: netBalance > 0 ? "#4CAF50" : netBalance < 0 ? "#F44336" : (darkMode ? "#CBD5E0" : "#666")
            }]}>
              {netBalance > 0 
                ? `Owes you ${currencySymbol}${netBalance.toFixed(2)}`
                : netBalance < 0 
                ? `You owe ${currencySymbol}${Math.abs(netBalance).toFixed(2)}`
                : "Settled up"
              }
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
          <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>
            Balance Overview
          </Text>
          
          <View style={[styles.balanceCard, darkMode && styles.darkBalanceCard]}>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={[styles.balanceLabel, darkMode && styles.darkBalanceLabel]}>
                  You owe {friendName}
                </Text>
                <Text style={[styles.balanceAmount, { color: "#F44336" }]}>
                  {currencySymbol}{youOweFriend.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.balanceItem}>
                <Text style={[styles.balanceLabel, darkMode && styles.darkBalanceLabel]}>
                  {friendName} owes you
                </Text>
                <Text style={[styles.balanceAmount, { color: "#4CAF50" }]}>
                  {currencySymbol}{friendOwesYou.toFixed(2)}
                </Text>
              </View>
            </View>
            
            <View style={[styles.divider, darkMode && styles.darkDivider]} />
            
            <View style={styles.netBalanceRow}>
              <Text style={[styles.netBalanceLabel, darkMode && styles.darkNetBalanceLabel]}>
                Net Balance
              </Text>
              <Text style={[styles.netBalanceAmount, { 
                color: netBalance > 0 ? "#4CAF50" : netBalance < 0 ? "#F44336" : (darkMode ? "#CBD5E0" : "#666")
              }]}>
                {netBalance > 0 ? "+" : ""}{currencySymbol}{netBalance.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Other Relationships */}
        {(friendOwesOthers > 0 || othersOweFriend > 0) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>
              {friendName}'s Other Balances
            </Text>
            
            <View style={[styles.otherBalancesCard, darkMode && styles.darkOtherBalancesCard]}>
              {friendOwesOthers > 0 && (
                <View style={styles.otherBalanceRow}>
                  <View style={styles.otherBalanceIcon}>
                    <Ionicons name="arrow-up" size={16} color="#F44336" />
                  </View>
                  <View style={styles.otherBalanceContent}>
                    <Text style={[styles.otherBalanceLabel, darkMode && styles.darkOtherBalanceLabel]}>
                      {friendName} owes others
                    </Text>
                    <Text style={[styles.otherBalanceAmount, { color: "#F44336" }]}>
                      {currencySymbol}{friendOwesOthers.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
              
              {othersOweFriend > 0 && (
                <View style={styles.otherBalanceRow}>
                  <View style={styles.otherBalanceIcon}>
                    <Ionicons name="arrow-down" size={16} color="#4CAF50" />
                  </View>
                  <View style={styles.otherBalanceContent}>
                    <Text style={[styles.otherBalanceLabel, darkMode && styles.darkOtherBalanceLabel]}>
                      Others owe {friendName}
                    </Text>
                    <Text style={[styles.otherBalanceAmount, { color: "#4CAF50" }]}>
                      {currencySymbol}{othersOweFriend.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {netBalance !== 0 && (
        <View style={[styles.actionContainer, darkMode && styles.darkActionContainer]}>
          <TouchableOpacity
            style={[styles.settleButton, darkMode && styles.darkSettleButton]}
            onPress={() => {
              // TODO: Implement settle up functionality
              console.log("Settle up with", friendName);
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.settleButtonText}>Settle Up</Text>
          </TouchableOpacity>
        </View>
      )}
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
    marginRight: 16,
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
    padding: 16,
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
  },
  otherBalanceLabel: {
    fontSize: 16,
    color: "#374151",
  },
  darkOtherBalanceLabel: {
    color: "#FFFFFF",
  },
  otherBalanceAmount: {
    fontSize: 16,
    fontWeight: "600",
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
});
