import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useSafeAreaInsets,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import BillsScreen from "./screens/BillsScreen";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import FriendsStackScreen from "./screens/FriendsStackScreen";
import HistoryScreen from "./screens/HistoryScreen";
import GroupsScreen from "./screens/GroupsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AntDesign from "@expo/vector-icons/AntDesign";
import Octicons from "@expo/vector-icons/Octicons";

const Tab = createBottomTabNavigator();

// Navigation constants
export const NAVIGATION_BAR_HEIGHT = 70;
export const getNavigationSpacing = (insets) =>
  Math.max(insets.bottom, 20) + 10 + NAVIGATION_BAR_HEIGHT;

function AppContent({ isChatActive }) {
  const [friends, setFriends] = useState([]);
  const [bills, setBills] = useState([]);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileEmoji, setProfileEmoji] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [liquidGlassMode, setLiquidGlassMode] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [lastTap, setLastTap] = useState(null);
  const insets = useSafeAreaInsets();
  const tabNames = ["Bills", "Friends", "Groups", "History", "Profile"];

  const navigationRef = useRef();
  const screenResetHandlers = useRef({});

  const registerScreenResetHandler = (routeName, handler) => {
    screenResetHandlers.current[routeName] = handler;
  };

  const handleTabPress = (index, navigation) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    // Check if this is a double tap
    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleTabDoublePress(index, navigation);
      setLastTap(null);
      return;
    }

    // Single tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLastTap(now);

    const routeName = tabNames[index];
    const currentRoute = navigationRef.current?.getCurrentRoute();
    const isAlreadyFocused = currentRoute?.name === routeName;

    // Single tap: navigate and animate bubble
    if (!isAlreadyFocused && navigation) {
      navigation.navigate(routeName);
    }

    setCurrentTabIndex(index);
  };

  const handleTabDoublePress = (index, navigation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const routeName = tabNames[index];

    // Double tap: navigate back to main screen for that tab
    navigation.navigate(routeName);

    // Also reset screen to top/initial state if handler exists
    if (screenResetHandlers.current[routeName]) {
      screenResetHandlers.current[routeName]();
    }
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
      const savedDarkMode = await AsyncStorage.getItem("darkMode");
      const savedLiquidGlassMode = await AsyncStorage.getItem(
        "liquidGlassMode"
      );
      const savedProfileEmoji = await AsyncStorage.getItem("profileEmoji");
      const savedProfileName = await AsyncStorage.getItem("profileName");
      const savedProfileEmail = await AsyncStorage.getItem("profileEmail");
      const savedProfilePhone = await AsyncStorage.getItem("profilePhone");

      if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
      if (savedLiquidGlassMode !== null)
        setLiquidGlassMode(JSON.parse(savedLiquidGlassMode));
      setProfileEmoji(savedProfileEmoji || "👤");
      if (savedProfileName) setProfileName(savedProfileName);
      if (savedProfileEmail) setProfileEmail(savedProfileEmail);
      if (savedProfilePhone) setProfilePhone(savedProfilePhone);
    };
    loadData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    AsyncStorage.setItem("liquidGlassMode", JSON.stringify(liquidGlassMode));
  }, [liquidGlassMode]);

  useEffect(() => {
    AsyncStorage.setItem("bills", JSON.stringify(bills));
  }, [bills]);

  // Load friends with user-scoped storage
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const userId = profileName?.trim() || "default_user";
        if (userId && userId !== "default_user") {
          const savedFriends = await AsyncStorage.getItem(`friends_${userId}`);
          if (savedFriends) {
            setFriends(JSON.parse(savedFriends));
          }
        }
      } catch (error) {
        console.error("Failed to load friends:", error);
      }
    };

    if (profileName) {
      loadFriends();
    }
  }, [profileName]);

  useEffect(() => {
    if (profileName) {
      AsyncStorage.setItem("profileName", profileName);
    }
  }, [profileName]);

  useEffect(() => {
    if (profileEmail) {
      AsyncStorage.setItem("profileEmail", profileEmail);
    }
  }, [profileEmail]);

  useEffect(() => {
    if (profilePhone) {
      AsyncStorage.setItem("profilePhone", profilePhone);
    }
  }, [profilePhone]);

  useEffect(() => {
    if (profileEmoji) {
      AsyncStorage.setItem("profileEmoji", profileEmoji);
    }
  }, [profileEmoji]);

  const addBill = (bill) => setBills((prev) => [...prev, bill]);
  const deleteBill = (id) =>
    setBills((prev) => prev.filter((b) => b.id !== id));
  const editBill = (updated) =>
    setBills((prev) =>
      prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
    );

  // Function to sync friends from FriendsScreen
  const syncFriends = async (updatedFriends) => {
    setFriends(updatedFriends);
  };

  const CustomTabBar = ({ state, navigation }) => {
    // Sync current tab index with navigation state
    useEffect(() => {
      if (state && state.index !== currentTabIndex) {
        setCurrentTabIndex(state.index);
      }
    }, [state.index]);

    return (
      <View
        style={{
          position: "absolute",
          bottom: Math.max(insets.bottom, 20) + -5,
          left: 17,
          right: 17,
          height: 80,
          justifyContent: "center",
        }}
      >
        {/* iOS-style liquid glass container */}
        <BlurView
          intensity={15}
          tint={darkMode ? "dark" : "light"}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 5,
            overflow: "hidden",
            backgroundColor: darkMode
              ? "rgba(0, 0, 0, 0.02)"
              : "rgba(255, 255, 255, 0.02)",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: darkMode
                ? "rgba(20, 20, 20, 0.01)"
                : "rgba(255, 255, 255, 0.01)",
              borderRadius: 25,
              borderWidth: 0.5,
              borderColor: darkMode
                ? "rgba(255, 255, 255, 0.01)"
                : "rgba(0, 0, 0, 0.01)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: darkMode ? 0.4 : 0.15,
              shadowRadius: 40,
              elevation: 20,
            }}
          />
        </BlurView>

        {/* Tab icons - on top for touch */}
        <View
          style={{
            flexDirection: "row",
            height: 65,
            alignItems: "center",
            paddingHorizontal: 10,
            zIndex: 10,
          }}
        >
          {[
            {
              name: "Bills",
              IconComponent: FontAwesome6,
              iconName: "money-bills",
            },
            {
              name: "Friends",
              IconComponent: FontAwesome5,
              iconName: "user-friends",
            },
            {
              name: "Groups",
              IconComponent: FontAwesome,
              iconName: "users",
              outlineIconName: "group",
            },
            { name: "History", IconComponent: Octicons, iconName: "history" },
            { name: "Profile", IconComponent: AntDesign, iconName: "user" },
          ].map((tab, index) => {
            const isActive = index === state.index;
            const IconComponent = tab.IconComponent;
            const iconName =
              isActive && tab.outlineIconName
                ? tab.iconName
                : tab.outlineIconName || tab.iconName;

            return (
              <Pressable
                key={tab.name}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 8,
                }}
                onPress={() => handleTabPress(index, navigation)}
                android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: true }}
              >
                <IconComponent
                  name={iconName}
                  size={isActive ? 28 : 24}
                  color={
                    isActive
                      ? darkMode
                        ? "#D69E2E"
                        : "#007AFF"
                      : darkMode
                      ? "#8E8E93"
                      : "#8E8E93"
                  }
                  style={{
                    transform: [{ scale: isActive ? 1.2 : 1 }],
                    marginBottom: 4,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isActive
                      ? darkMode
                        ? "#D69E2E"
                        : "#007AFF"
                      : darkMode
                      ? "#8E8E93"
                      : "#8E8E93",
                    opacity: isActive ? 1 : 0.8,
                  }}
                >
                  {tab.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Tab.Navigator
      ref={navigationRef}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // Hide default tab bar
      }}
      tabBar={(props) => (!isChatActive ? <CustomTabBar {...props} /> : null)}
      screenListeners={{
        tabPress: () => {
          // Custom tab handling is done via handleTabPress
        },
      }}
    >
      <Tab.Screen name="Bills">
        {() => (
          <BillsScreen
            friends={friends}
            addBill={addBill}
            profileName={profileName}
            profileEmoji={profileEmoji}
            darkMode={darkMode}
            liquidGlassMode={liquidGlassMode}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Friends">
        {() => (
          <FriendsStackScreen
            friends={friends}
            setFriends={setFriends}
            syncFriends={syncFriends}
            bills={bills}
            profileName={profileName}
            profileEmoji={profileEmoji}
            setProfileEmoji={setProfileEmoji}
            darkMode={darkMode}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Groups">
        {() => (
          <GroupsScreen
            friends={friends}
            profileName={profileName}
            profileEmoji={profileEmoji}
            darkMode={darkMode}
            addBill={addBill}
            editBill={editBill}
            deleteBill={deleteBill}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="History">
        {() => (
          <HistoryScreen
            bills={bills}
            deleteBill={deleteBill}
            editBill={editBill}
            addBill={addBill}
            friends={friends}
            profileName={profileName}
            profileEmoji={profileEmoji}
            darkMode={darkMode}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => (
          <ProfileScreen
            profileName={profileName}
            setProfileName={setProfileName}
            profileEmoji={profileEmoji}
            setProfileEmoji={setProfileEmoji}
            profileEmail={profileEmail}
            setProfileEmail={setProfileEmail}
            profilePhone={profilePhone}
            setProfilePhone={setProfilePhone}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            liquidGlassMode={liquidGlassMode}
            setLiquidGlassMode={setLiquidGlassMode}
            onTabPress={(resetHandler) =>
              registerScreenResetHandler("Profile", resetHandler)
            }
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isChatActive, setIsChatActive] = useState(false);

  const onNavigationStateChange = (state) => {
    // Deep search for active route in nested navigators
    const findActiveRoute = (navState) => {
      if (!navState || !navState.routes) return null;

      const activeRoute = navState.routes[navState.index];
      if (activeRoute.state) {
        return findActiveRoute(activeRoute.state);
      }
      return activeRoute;
    };

    const activeRoute = findActiveRoute(state);
    setIsChatActive(activeRoute?.name === "Chat");
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer onStateChange={onNavigationStateChange}>
          <AppContent isChatActive={isChatActive} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
