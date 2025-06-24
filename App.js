import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BillsScreen from "./screens/BillsScreen";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import FriendsStackScreen from "./screens/FriendsStackScreen";
import HistoryScreen from "./screens/HistoryScreen";
import GroupsScreen from "./screens/GroupsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AntDesign from "@expo/vector-icons/AntDesign";
import Octicons from "@expo/vector-icons/Octicons";

const Tab = createBottomTabNavigator();

export default function App() {
  const [friends, setFriends] = useState([]);
  const [bills, setBills] = useState([]);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  const professionalColors = [
    "#2C3E50",
    "#3498DB",
    "#1ABC9C",
    "#F39C12",
    "#E74C3C",
    "#8E44AD",
    "#27AE60",
    "#34495E",
    "#16A085",
    "#2980B9",
    "#95A5A6",
    "#D35400",
    "#7F8C8D",
    "#BDC3C7",
    "#2ECC71",
    "#F1C40F",
    "#5D6D7E",
    "#273746",
    "#566573",
    "#AAB7B8",
    "#C0392B",
    "#7D3C98",
    "#45B39D",
    "#117A65",
    "#F5B041",
  ];

  useEffect(() => {
    const loadBills = async () => {
      const savedBills = await AsyncStorage.getItem("bills");
      if (savedBills) setBills(JSON.parse(savedBills));
    };
    loadBills();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const savedFriends = await AsyncStorage.getItem("friends");

      if (savedFriends) setFriends(JSON.parse(savedFriends));
    };
    loadData();
  }, []);

  function getRandomColor() {
    const index = Math.floor(Math.random() * professionalColors.length);
    return professionalColors[index];
  }

  useEffect(() => {
    AsyncStorage.setItem("bills", JSON.stringify(bills));
  }, [bills]);

  const addBill = (bill) => setBills((prev) => [...prev, bill]);
  const deleteBill = (id) =>
    setBills((prev) => prev.filter((b) => b.id !== id));
  const editBill = (updated) =>
    setBills((prev) =>
      prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
    );

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen
          name="Bills"
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="cash-outline"
                size={24}
                color={getRandomColor()}
              />
            ),
          }}
        >
          {() => (
            <BillsScreen
              friends={friends}
              addBill={addBill}
              profileName={profileName}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Friends"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome5
                name="user-friends"
                size={24}
                color={getRandomColor()}
              />
            ),
          }}
        >
          {() => (
            <FriendsStackScreen
              friends={friends}
              setFriends={setFriends}
              bills={bills}
              profileName={profileName}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Groups"
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome name="group" size={24} color={getRandomColor()} />
            ),
          }}
        >
          {() => (
            <GroupsScreen
              friends={friends} // Make sure this is the actual friends array
              bills={bills}
              addBill={addBill}
              profileName={profileName}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="History"
          options={{
            tabBarIcon: ({ color }) => (
              <Octicons name="history" size={24} color={getRandomColor()} />
            ),
          }}
        >
          {() => (
            <HistoryScreen
              bills={bills}
              deleteBill={deleteBill}
              editBill={editBill}
              friends={friends}
              profileName={profileName}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Profile"
          options={{
            tabBarIcon: ({ color }) => (
              <AntDesign name="profile" size={24} color={getRandomColor()} />
            ),
          }}
        >
          {() => (
            <ProfileScreen
              profileName={profileName}
              setProfileName={setProfileName}
              profileEmail={profileEmail}
              setProfileEmail={setProfileEmail}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
