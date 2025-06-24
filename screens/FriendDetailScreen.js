import React, { useState, useEffect, useMemo } from "react";
import { View, Text, SafeAreaView, Pressable, StyleSheet } from "react-native";
import { getCurrencySymbol } from "../utils/helpers";

export default function FriendDetailScreen({
  route,
  bills,
  profileName,
  friends,
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{friendName}'s Summary</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          You owe {friendName}:{" "}
          <Text style={styles.owedAmount}>
            {currencySymbol}
            {youOweFriend.toFixed(2)}
          </Text>
        </Text>
        <Text style={styles.summaryText}>
          {friendName} owes you:{" "}
          <Text style={styles.owedAmount}>
            {currencySymbol}
            {friendOwesYou.toFixed(2)}
          </Text>
        </Text>
        {/* NEW LINES ADDED HERE */}
        <Text style={styles.summaryText}>
          {friendName} owes others:{" "}
          <Text style={styles.owedAmount}>
            {currencySymbol}
            {friendOwesOthers.toFixed(2)}
          </Text>
        </Text>
        <Text style={styles.summaryText}>
          Others owe {friendName}:{" "}
          <Text style={styles.owedAmount}>
            {currencySymbol}
            {othersOweFriend.toFixed(2)}
          </Text>
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.settleButton,
          pressed && styles.settleButtonPressed,
        ]}
      >
        <Text style={styles.settleButtonText}>Settle Up</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFE4D2",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2356A8",
    alignSelf: "center",
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: "#fff",
    width: 350,
    height: 150,
    left: 20,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryText: {
    fontSize: 18,
    marginBottom: 10,
    color: "#333",
  },
  owedAmount: {
    fontWeight: "bold",
    color: "#D32F2F", // Red for amounts you owe
  },
  settleButton: {
    backgroundColor: "#2356A8",
    padding: 14,
    width: 350,
    borderRadius: 10,
    marginTop: 20,
    left: 20,
    alignItems: "center",
  },
  settleButtonPressed: {
    backgroundColor: "#1C4A8D",
    transform: [{ scale: 0.98 }],
  },
  settleButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
