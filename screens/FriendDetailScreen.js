import { useState, useEffect, useMemo, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getCurrencySymbol, validateNoteWordCount } from "../utils/helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Typography, Spacing, BorderRadius } from "../styles/theme";

export default function FriendDetailScreen({
  route,
  navigation,
  bills,
  profileName,
  profileEmoji,
  friends,
  darkMode = false,
}) {
  const insets = useSafeAreaInsets();
  const navigationSpacing = Math.max(insets.bottom, 20) + 10 + 30;
  const { friendName } = route.params;
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [settlements, setSettlements] = useState([]);
  const [isLoadingSettlement, setIsLoadingSettlement] = useState(false);
  const [allSettlements, setAllSettlements] = useState({});

  const currentUserName = profileName?.trim();
  const isOwnProfile = friendName === currentUserName;

  useEffect(() => {
    loadSettlements();
  }, [friendName]);

  useFocusEffect(
    useCallback(() => {
      loadSettlements();
    }, [friendName])
  );

  const loadSettlements = async () => {
    try {
      const userA = currentUserName < friendName ? currentUserName : friendName;
      const userB = currentUserName < friendName ? friendName : currentUserName;
      const settlementKey = `settlements_${userA}_${userB}`;

      const saved = await AsyncStorage.getItem(settlementKey);
      if (saved) {
        const userFriendSettlements = JSON.parse(saved);
        userFriendSettlements.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setSettlements(userFriendSettlements);
      }

      const allKeys = await AsyncStorage.getAllKeys();
      const settlementKeys = allKeys.filter((key) =>
        key.startsWith("settlements_")
      );
      const allSettlementsData = {};

      for (const key of settlementKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const keyParts = key.replace("settlements_", "").split("_");
            const [userA, userB] = keyParts;
            const settlements = JSON.parse(data);

            if (!allSettlementsData[userA]) allSettlementsData[userA] = {};
            if (!allSettlementsData[userB]) allSettlementsData[userB] = {};

            allSettlementsData[userA][userB] = settlements;
            allSettlementsData[userB][userA] = settlements;
          }
        } catch (error) {
          console.error(`Failed to load settlement key ${key}:`, error);
        }
      }

      setAllSettlements(allSettlementsData);
    } catch (error) {
      console.error("Failed to load settlements:", error);
    }
  };

  const saveSettlement = async (newSettlement) => {
    const previousSettlements = [...settlements];
    try {
      const updatedSettlements = [newSettlement, ...settlements];
      setSettlements(updatedSettlements);

      const userA = currentUserName < friendName ? currentUserName : friendName;
      const userB = currentUserName < friendName ? friendName : currentUserName;
      const settlementKey = `settlements_${userA}_${userB}`;

      await AsyncStorage.setItem(
        settlementKey,
        JSON.stringify(updatedSettlements)
      );
    } catch (error) {
      console.error("Failed to save settlement:", error);
      setSettlements(previousSettlements);
      Alert.alert(
        "Settlement Save Failed",
        "Unable to save settlement. Please check your device storage and try again.",
        [{ text: "OK" }]
      );
      throw error;
    }
  };

  const [youOweFriend, setYouOweFriend] = useState(0);
  const [friendOwesYou, setFriendOwesYou] = useState(0);
  const [friendOwesOthers, setFriendOwesOthers] = useState(0);
  const [othersOweFriend, setOthersOweFriend] = useState(0);
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

    const friendNetBalanceWithSpecificOthers = {};

    bills.forEach((bill) => {
      const { payer, splitWith = [], currency: billCurrency } = bill;

      const isFriendInvolved =
        payer === friendName || splitWith.includes(friendName);
      if (!isFriendInvolved) return;

      if (billCurrency && currency !== billCurrency) {
        setCurrency(billCurrency);
      }

      const totalAmount = Math.round(parseFloat(bill.amount) * 100) / 100;
      const splitType = bill.splitType || "equal";
      const splitAmounts = bill.splitAmounts || {};

      let individualAmounts = {};

      if (splitType === "exact" && splitAmounts) {
        individualAmounts = splitAmounts;
      } else if (splitType === "percentage" && splitAmounts) {
        splitWith.forEach((person) => {
          const percentage = splitAmounts[person] || 0;
          individualAmounts[person] =
            Math.round(((totalAmount * percentage) / 100) * 100) / 100;
        });
      } else {
        const perPersonAmount =
          splitWith.length > 0
            ? Math.round((totalAmount / splitWith.length) * 100) / 100
            : 0;
        splitWith.forEach((person) => {
          individualAmounts[person] = perPersonAmount;
        });
      }

      // Calculate You vs. Friend (For non-own profile only)
      if (!isOwnProfile) {
        if (payer === currentUserName) {
          if (
            splitWith.includes(friendName) &&
            friendName !== currentUserName
          ) {
            currentFriendOwesYou += individualAmounts[friendName] || 0;
          }
        } else if (payer === friendName) {
          if (
            splitWith.includes(currentUserName) &&
            currentUserName !== friendName
          ) {
            currentYouOweFriend += individualAmounts[currentUserName] || 0;
          }
        }
      }

      // Calculate Friend vs. Others
      splitWith.forEach((participant) => {
        if (participant === currentUserName || participant === friendName) {
          return;
        }

        if (payer === friendName) {
          friendNetBalanceWithSpecificOthers[participant] =
            (friendNetBalanceWithSpecificOthers[participant] || 0) +
            (individualAmounts[participant] || 0);
        } else if (payer === participant) {
          friendNetBalanceWithSpecificOthers[participant] =
            (friendNetBalanceWithSpecificOthers[participant] || 0) -
            (individualAmounts[friendName] || 0);
        }
      });
    });

    // Aggregate Friend vs. Others
    for (const otherPerson in friendNetBalanceWithSpecificOthers) {
      const netAmount = friendNetBalanceWithSpecificOthers[otherPerson];
      if (netAmount < 0) {
        totalFriendOwesOthers += Math.abs(netAmount);
      } else if (netAmount > 0) {
        totalOthersOweFriend += netAmount;
      }
    }

    // FIXED: For own profile, use the Other Balances values for Balance Overview
    if (isOwnProfile) {
      currentYouOweFriend = totalFriendOwesOthers;
      currentFriendOwesYou = totalOthersOweFriend;
    }

    // Check if there are any bills involving this friend and current user
    const hasValidBillsWithFriend = bills.some((bill) => {
      const isCurrentUserInvolved =
        bill.payer === currentUserName ||
        (bill.splitWith && bill.splitWith.includes(currentUserName));
      const isFriendInvolved =
        bill.payer === friendName ||
        (bill.splitWith && bill.splitWith.includes(friendName));
      return isCurrentUserInvolved && isFriendInvolved;
    });

    // Apply settlements to reduce balances - only if there are valid bills
    if (hasValidBillsWithFriend && !isOwnProfile) {
      const billDates = bills
        .filter((bill) => {
          const isCurrentUserInvolved =
            bill.payer === currentUserName ||
            (bill.splitWith && bill.splitWith.includes(currentUserName));
          const isFriendInvolved =
            bill.payer === friendName ||
            (bill.splitWith && bill.splitWith.includes(friendName));
          return isCurrentUserInvolved && isFriendInvolved;
        })
        .map((bill) => new Date(bill.date || 0));

      const firstBillDate =
        billDates.length > 0 ? Math.min(...billDates) : new Date();

      const validSettlements = settlements.filter((settlement) => {
        const settlementDate = new Date(settlement.date);
        return settlementDate >= firstBillDate;
      });

      validSettlements.forEach((settlement) => {
        const settleAmount =
          Math.round(parseFloat(settlement.amount) * 100) / 100;
        const direction = settlement.direction;

        if (
          direction === "user_to_friend" ||
          (!direction && settlement.payerName === currentUserName)
        ) {
          if (currentYouOweFriend >= settleAmount) {
            currentYouOweFriend -= settleAmount;
          } else {
            const remaining = settleAmount - currentYouOweFriend;
            currentYouOweFriend = 0;
            currentFriendOwesYou += remaining;
          }
        } else if (
          direction === "friend_to_user" ||
          (!direction && settlement.payerName === friendName)
        ) {
          if (currentFriendOwesYou >= settleAmount) {
            currentFriendOwesYou -= settleAmount;
          } else {
            const remaining = settleAmount - currentFriendOwesYou;
            currentFriendOwesYou = 0;
            currentYouOweFriend += remaining;
          }
        }
      });
    } else if (!hasValidBillsWithFriend && !isOwnProfile) {
      currentYouOweFriend = 0;
      currentFriendOwesYou = 0;
    }

    // Final calculation with proper rounding
    if (isOwnProfile) {
      setYouOweFriend(Math.round(currentYouOweFriend * 100) / 100);
      setFriendOwesYou(Math.round(currentFriendOwesYou * 100) / 100);
    } else {
      const netYouOwe =
        Math.round((currentYouOweFriend - currentFriendOwesYou) * 100) / 100;
      const netFriendOwes =
        Math.round((currentFriendOwesYou - currentYouOweFriend) * 100) / 100;

      if (netYouOwe > 0) {
        setYouOweFriend(netYouOwe);
        setFriendOwesYou(0);
      } else if (netFriendOwes > 0) {
        setFriendOwesYou(netFriendOwes);
        setYouOweFriend(0);
      } else {
        setYouOweFriend(0);
        setFriendOwesYou(0);
      }
    }

    // Apply settlements to "Other Balances" between friend and other users
    const adjustedFriendNetBalanceWithSpecificOthers = {
      ...friendNetBalanceWithSpecificOthers,
    };

    for (const otherPerson in adjustedFriendNetBalanceWithSpecificOthers) {
      const settlementsWithOther =
        allSettlements[friendName]?.[otherPerson] || [];

      const billDatesWithOther = bills
        .filter((bill) => {
          const isFriendInvolved =
            bill.payer === friendName ||
            (bill.splitWith && bill.splitWith.includes(friendName));
          const isOtherInvolved =
            bill.payer === otherPerson ||
            (bill.splitWith && bill.splitWith.includes(otherPerson));
          return isFriendInvolved && isOtherInvolved;
        })
        .map((bill) => new Date(bill.date || 0));

      if (billDatesWithOther.length === 0) {
        adjustedFriendNetBalanceWithSpecificOthers[otherPerson] = 0;
        continue;
      }

      const firstBillDateWithOther = Math.min(...billDatesWithOther);

      const validSettlementsWithOther = settlementsWithOther.filter(
        (settlement) => {
          const settlementDate = new Date(settlement.date);
          return settlementDate >= firstBillDateWithOther;
        }
      );

      validSettlementsWithOther.forEach((settlement) => {
        const settleAmount =
          Math.round(parseFloat(settlement.amount) * 100) / 100;
        const direction = settlement.direction;
        const payerName = settlement.payerName;

        if (
          direction === "user_to_friend" ||
          direction === "friend_to_user" ||
          payerName === friendName ||
          payerName === otherPerson
        ) {
          let currentBalance =
            adjustedFriendNetBalanceWithSpecificOthers[otherPerson];

          if (payerName === friendName) {
            if (currentBalance < 0) {
              const newBalance = currentBalance + settleAmount;
              adjustedFriendNetBalanceWithSpecificOthers[otherPerson] =
                newBalance > 0 ? newBalance : 0;
            } else {
              adjustedFriendNetBalanceWithSpecificOthers[otherPerson] =
                currentBalance + settleAmount;
            }
          } else if (payerName === otherPerson) {
            if (currentBalance > 0) {
              const newBalance = currentBalance - settleAmount;
              adjustedFriendNetBalanceWithSpecificOthers[otherPerson] =
                newBalance > 0 ? newBalance : 0;
            } else {
              adjustedFriendNetBalanceWithSpecificOthers[otherPerson] =
                currentBalance - settleAmount;
            }
          }
        }
      });
    }

    // Recalculate totals after applying settlements
    totalFriendOwesOthers = 0;
    totalOthersOweFriend = 0;
    for (const otherPerson in adjustedFriendNetBalanceWithSpecificOthers) {
      const netAmount =
        Math.round(
          adjustedFriendNetBalanceWithSpecificOthers[otherPerson] * 100
        ) / 100;
      adjustedFriendNetBalanceWithSpecificOthers[otherPerson] = netAmount;

      if (netAmount < 0) {
        totalFriendOwesOthers += Math.abs(netAmount);
      } else if (netAmount > 0) {
        totalOthersOweFriend += netAmount;
      }
    }

    totalFriendOwesOthers = Math.round(totalFriendOwesOthers * 100) / 100;
    totalOthersOweFriend = Math.round(totalOthersOweFriend * 100) / 100;

    setFriendOwesOthers(totalFriendOwesOthers);
    setOthersOweFriend(totalOthersOweFriend);
    setFriendNetBalanceWithSpecificOthers(
      adjustedFriendNetBalanceWithSpecificOthers
    );

    // FIXED: Update Balance Overview to match Other Balances for own profile
    if (isOwnProfile) {
      setYouOweFriend(totalFriendOwesOthers);
      setFriendOwesYou(totalOthersOweFriend);
    }
  }, [
    bills,
    friendName,
    currentUserName,
    friends,
    currency,
    settlements,
    allSettlements,
  ]);

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  const friendEmoji = useMemo(() => {
    const friendData = friends.find((f) => f.name === friendName);
    return isOwnProfile ? profileEmoji || "👤" : friendData?.emoji || "👤";
  }, [isOwnProfile, profileEmoji, friends, friendName]);

  const netBalance = friendOwesYou - youOweFriend;

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={darkMode ? Colors.background.dark : Colors.background.light}
      />

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
            <View
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: Colors.success.light,
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
                  color: Colors.success.light,
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
                    currentUserName || "you"
                  } ${currencySymbol}${netBalance.toFixed(2)}`
                : netBalance < 0
                ? `${currentUserName || "You"} owes ${currencySymbol}${Math.abs(
                    netBalance
                  ).toFixed(2)}`
                : "Settled up"}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons in Header */}
      {!isOwnProfile && (
        <View
          style={[
            styles.headerActionContainer,
            darkMode && styles.darkHeaderActionContainer,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.headerChatButton,
              darkMode && styles.darkHeaderChatButton,
              { marginRight: 12 },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate("Chat", {
                friendName: friendName,
                friendEmoji: friendEmoji,
                currentUser: profileName,
              });
            }}
          >
            <Ionicons
              name="chatbubble"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.headerChatButtonText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.headerSettleButton,
              darkMode && styles.darkHeaderSettleButton,
            ]}
            activeOpacity={0.8}
            onPress={() => {
              if (Math.abs(netBalance) < 0.01) {
                Alert.alert(
                  "No Balance to Settle",
                  `You and ${friendName} are already settled up! There are no outstanding balances to settle.`,
                  [{ text: "OK", style: "default" }]
                );
                return;
              }
              setShowSettleModal(true);
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.headerSettleButtonText}>Settle Up</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: navigationSpacing }}
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
                    ? `${currentUserName || "You"} owe friends`
                    : `${currentUserName || "You"} owe ${friendName}`}
                </Text>
                <Text style={[styles.balanceAmount, { color: Colors.error.light }]}>
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
                    ? `Friends owe ${currentUserName || "you"}`
                    : `${friendName} owes ${currentUserName || "you"}`}
                </Text>
                <Text style={[styles.balanceAmount, { color: Colors.success.light }]}>
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
                ? `${currentUserName || "Your"} Other Balances`
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
                          ? `${currentUserName || "You"} owes others`
                          : `${friendName} owes others`}
                      </Text>
                      <Text
                        style={[
                          styles.otherBalanceAmount,
                          { color: Colors.error.light },
                        ]}
                      >
                        {currencySymbol}
                        {friendOwesOthers.toFixed(2)}
                      </Text>
                    </View>
                  </View>
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
                          ? `Others owe ${currentUserName || "you"}`
                          : `Others owe ${friendName}`}
                      </Text>
                      <Text
                        style={[
                          styles.otherBalanceAmount,
                          { color: Colors.success.light },
                        ]}
                      >
                        {currencySymbol}
                        {othersOweFriend.toFixed(2)}
                      </Text>
                    </View>
                  </View>
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
              style={[
                styles.sectionTitle,
                darkMode && styles.darkSectionTitle,
                { marginBottom: 16 },
              ]}
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
                      {(() => {
                        const settlementDate = new Date(settlement.date);
                        const now = new Date();
                        const diffDays = Math.floor(
                          (now - settlementDate) / (1000 * 60 * 60 * 24)
                        );

                        if (diffDays === 0) {
                          return `Today at ${settlementDate.toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}`;
                        } else if (diffDays === 1) {
                          return `Yesterday at ${settlementDate.toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}`;
                        } else if (diffDays < 7) {
                          return `${diffDays} days ago`;
                        } else {
                          return settlementDate.toLocaleDateString();
                        }
                      })()}
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
                  onChangeText={(text) => {
                    try {
                      const cleanValue = text.replace(/[^0-9.]/g, "");
                      const parts = cleanValue.split(".");

                      let formattedValue = parts[0];
                      if (parts.length > 1) {
                        formattedValue += "." + parts[1].substring(0, 2);
                      }

                      if (formattedValue.length <= 12) {
                        setSettleAmount(formattedValue);
                      }
                    } catch (error) {
                      console.error("Amount input error:", error);
                    }
                  }}
                  keyboardType="numeric"
                  accessibilityLabel="Settlement amount input"
                  accessibilityHint="Enter the amount to settle"
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
                  onChangeText={(text) => {
                    try {
                      const sanitized = text
                        .replace(/[<>{}]/g, "")
                        .substring(0, 200);
                      setSettleNote(sanitized);
                    } catch (error) {
                      console.error("Note input error:", error);
                    }
                  }}
                  multiline
                  numberOfLines={2}
                  maxLength={200}
                  accessibilityLabel="Payment method input"
                  accessibilityHint="Enter the payment method used"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.cancelButton,
                      darkMode && styles.darkCancelButton,
                    ]}
                    onPress={() => {
                      setShowSettleModal(false);
                      setSettleAmount("");
                      setSettleNote("");
                    }}
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
                    style={[
                      styles.modalButton,
                      [
                        styles.confirmButton,
                        darkMode && styles.darkConfirmButton,
                        isLoadingSettlement && { opacity: 0.7 },
                      ],
                    ]}
                    disabled={isLoadingSettlement}
                    onPress={() => {
                      try {
                        const cleanAmount = settleAmount.replace(
                          /[^0-9.]/g,
                          ""
                        );
                        const amount = parseFloat(cleanAmount);

                        if (!cleanAmount || isNaN(amount) || amount <= 0) {
                          Alert.alert(
                            "Invalid Amount",
                            "Please enter a valid amount greater than 0"
                          );
                          return;
                        }

                        if (amount < 0.01) {
                          Alert.alert(
                            "Amount Too Small",
                            "Amount must be at least 0.01"
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

                        const cleanNote = settleNote
                          .replace(/[<>{}]/g, "")
                          .trim();

                        const noteValidation = validateNoteWordCount(cleanNote);
                        if (!noteValidation.isValid) {
                          Alert.alert("Note Too Long", noteValidation.error);
                          return;
                        }

                        const isUserPayingFriend = netBalance < 0;

                        const settlement = {
                          id: `settle_${Date.now()}_${Math.random()}`,
                          amount: amount,
                          note: cleanNote || "No payment method specified",
                          date: new Date().toISOString(),
                          friendName: friendName,
                          settledBy: currentUserName || "Unknown User",
                          payerName: isUserPayingFriend
                            ? currentUserName
                            : friendName,
                          receiverName: isUserPayingFriend
                            ? friendName
                            : currentUserName,
                          direction: isUserPayingFriend
                            ? "user_to_friend"
                            : "friend_to_user",
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
                                try {
                                  setIsLoadingSettlement(true);

                                  await new Promise((resolve) =>
                                    setTimeout(resolve, 800)
                                  );

                                  await saveSettlement(settlement);

                                  setShowSettleModal(false);
                                  setSettleAmount("");
                                  setSettleNote("");

                                  setTimeout(() => {
                                    Alert.alert(
                                      "Settlement Recorded",
                                      `${currencySymbol}${amount.toFixed(
                                        2
                                      )} settlement has been recorded successfully!\n\nBalances have been updated to reflect this payment.`
                                    );
                                  }, 300);
                                } catch (error) {
                                  console.error(
                                    "Settlement save error:",
                                    error
                                  );
                                  Alert.alert(
                                    "Settlement Failed",
                                    "Unable to save settlement. Please check your connection and try again."
                                  );
                                } finally {
                                  setIsLoadingSettlement(false);
                                }
                              },
                            },
                          ]
                        );
                      } catch (error) {
                        console.error("Settlement validation error:", error);
                        Alert.alert(
                          "Error",
                          "Failed to process settlement. Please try again."
                        );
                      }
                    }}
                  >
                    {isLoadingSettlement ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.confirmButtonText,
                          darkMode && styles.darkConfirmButtonText,
                        ]}
                      >
                        Settle Up
                      </Text>
                    )}
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
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  darkContainer: {
    backgroundColor: Colors.background.dark,
  },
  header: {
    backgroundColor: Colors.background.card.light,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing["2xl"],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  darkHeader: {
    backgroundColor: Colors.background.card.dark,
    borderBottomColor: Colors.gray600,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background.light,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.text.accent.dark,
  },
  darkFriendAvatar: {
    backgroundColor: Colors.gray600,
    borderColor: Colors.text.accent.dark,
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
    color: Colors.primary,
    marginBottom: 4,
  },
  darkFriendName: {
    color: Colors.text.accent.dark,
  },
  balanceStatus: {
    fontSize: 16,
    fontWeight: "500",
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
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
  headerActionContainer: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  darkHeaderActionContainer: {
    backgroundColor: "#2D3748",
    borderBottomColor: "#4A5568",
  },
  headerChatButton: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flex: 1,
  },
  darkHeaderChatButton: {
    backgroundColor: "#64B5F6",
  },
  headerChatButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  headerSettleButton: {
    backgroundColor: "#8B4513",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flex: 1,
  },
  darkHeaderSettleButton: {
    backgroundColor: "#D69E2E",
  },
  headerSettleButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
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
  darkCancelButton: {
    backgroundColor: "#374151",
    borderColor: "#4B5563",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "500",
  },
  darkCancelButtonText: {
    color: "#E2E8F0",
  },
  confirmButton: {
    backgroundColor: "#8B4513",
  },
  darkConfirmButton: {
    backgroundColor: "#D69E2E",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  darkConfirmButtonText: {
    color: "#FFFFFF",
  },
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
  otherBalanceSection: {
    marginBottom: 16,
  },
  individualBreakdown: {
    marginTop: 8,
    marginLeft: 44,
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
