import React, { useState, useEffect, useRef } from "react";
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
  const [profileEmoji, setProfileEmoji] = useState("👤");
  const [darkMode, setDarkMode] = useState(false);

  // Navigation refs for double-tap functionality
  const navigationRef = useRef();
  const lastTapRef = useRef({});
  const screenResetHandlers = useRef({});

  const handleTabPress = (routeName) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[routeName] || 0;

    if (now - lastTap < 300) {
      // Double tap within 300ms
      // Reset to main screen of the tab
      if (navigationRef.current) {
        navigationRef.current.navigate(routeName);
        // Call screen-specific reset handler if available
        const resetHandler = screenResetHandlers.current[routeName];
        if (resetHandler) {
          resetHandler();
        }
      }
    }

    lastTapRef.current[routeName] = now;
  };

  const registerScreenResetHandler = (routeName, handler) => {
    screenResetHandlers.current[routeName] = handler;
  };

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
      const savedDarkMode = await AsyncStorage.getItem("darkMode");
      const savedProfileEmoji = await AsyncStorage.getItem("profileEmoji");

      if (savedFriends) setFriends(JSON.parse(savedFriends));
      if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
      if (savedProfileEmoji) setProfileEmoji(savedProfileEmoji);
    };
    loadData();
  }, []);

  // Save dark mode preference
  useEffect(() => {
    AsyncStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

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
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: darkMode ? "#2D3748" : "#FFFFFF",
            borderTopColor: darkMode ? "#4A5568" : "#E5E7EB",
            paddingBottom: 4,
            paddingTop: 4,
            height: 80,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarActiveTintColor: darkMode ? "#D69E2E" : "#8B4513", // Gold in dark mode, brown in light mode
          tabBarInactiveTintColor: darkMode ? "#A0AEC0" : "#6B7280",
        })}
        screenListeners={({ route }) => ({
          tabPress: (e) => {
            handleTabPress(route.name);
          },
        })}
      >
        <Tab.Screen
          name="Bills"
          options={{
            tabBarLabel: "Bills",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "cash" : "cash-outline"}
                size={24}
                color={color}
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
            tabBarLabel: "Friends",
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome5 name="user-friends" size={24} color={color} />
            ),
          }}
        >
          {() => (
            <FriendsStackScreen
              friends={friends}
              setFriends={setFriends}
              bills={bills}
              profileName={profileName}
              profileEmoji={profileEmoji}
              setProfileEmoji={setProfileEmoji}
              darkMode={darkMode}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Groups"
          options={{
            tabBarLabel: "Groups",
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome
                name={focused ? "users" : "group"}
                size={24}
                color={color}
              />
            ),
          }}
        >
          {() => (
            <GroupsScreen
              friends={friends} // Make sure this is the actual friends array
              bills={bills}
              addBill={addBill}
              profileName={profileName}
              darkMode={darkMode}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="History"
          options={{
            tabBarLabel: "History",
            tabBarIcon: ({ color, focused }) => (
              <Octicons name="history" size={24} color={color} />
            ),
          }}
        >
          {() => (
            <HistoryScreen
              bills={bills}
              deleteBill={deleteBill}
              editBill={editBill}
              addBill={addBill}
              friends={friends}
              profileName={profileName}
              darkMode={darkMode}
            />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Profile"
          options={{
            tabBarLabel: "Profile",
            tabBarIcon: ({ color }) => (
              <AntDesign
                name="user"
                size={24}
                color={color}
              />
            ),
          }}
        >
          {() => (
            <ProfileScreen
              profileName={profileName}
              setProfileName={setProfileName}
              profileEmail={profileEmail}
              setProfileEmail={setProfileEmail}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onTabPress={(resetHandler) =>
                registerScreenResetHandler("Profile", resetHandler)
              }
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
