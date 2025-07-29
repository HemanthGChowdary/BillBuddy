import { useState, useEffect, useRef } from "react";
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
import { Colors } from "./styles/theme";

import BillsScreen from "./screens/BillsScreen";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FriendsStackScreen from "./screens/FriendsStackScreen";
import HistoryScreen from "./screens/HistoryScreen";
import GroupsScreen from "./screens/GroupsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AuthScreen from "./screens/AuthScreen";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
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
      const savedAuthState = await AsyncStorage.getItem("isAuthenticated");

      if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
      if (savedLiquidGlassMode !== null)
        setLiquidGlassMode(JSON.parse(savedLiquidGlassMode));
      setProfileEmoji(savedProfileEmoji || "👤");
      if (savedProfileName) setProfileName(savedProfileName);
      if (savedProfileEmail) setProfileEmail(savedProfileEmail);
      if (savedProfilePhone) setProfilePhone(savedProfilePhone);
      
      // Check if user is authenticated and account is not deleted
      if (savedAuthState !== null && savedProfileEmail) {
        const isAuthenticatedValue = JSON.parse(savedAuthState);
        if (isAuthenticatedValue) {
          // Check if this email was deleted
          const emailToCheck = savedProfileEmail.toLowerCase();
          const deletedAccountsData = await AsyncStorage.getItem("@deleted_accounts");
          
          if (deletedAccountsData) {
            const deletedAccounts = JSON.parse(deletedAccountsData);
            const isDeleted = deletedAccounts.some(account => account.email === emailToCheck);
            
            if (isDeleted) {
              // Clear authentication for deleted account
              await AsyncStorage.removeItem("isAuthenticated");
              await AsyncStorage.removeItem("profileEmail");
              await AsyncStorage.removeItem("profileName");
              await AsyncStorage.removeItem("profilePhone");
              setIsAuthenticated(false);
              setProfileEmail("");
              setProfileName("");
              setProfilePhone("");
            } else {
              setIsAuthenticated(true);
            }
          } else {
            setIsAuthenticated(true);
          }
        }
      }
      
      setIsCheckingAuth(false);
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

  // Authentication handlers
  const handleSignIn = async (credentials) => {
    try {
      // Check if this email was previously deleted
      const emailToCheck = credentials.email.toLowerCase();
      const deletedAccountsData = await AsyncStorage.getItem("@deleted_accounts");
      
      if (deletedAccountsData) {
        const deletedAccounts = JSON.parse(deletedAccountsData);
        const isDeleted = deletedAccounts.some(account => account.email === emailToCheck);
        
        if (isDeleted) {
          throw new Error("This account has been permanently deleted and cannot be restored. Please create a new account.");
        }
      }
      
      // Validate password
      const storedPasswordHash = await AsyncStorage.getItem(`password_${emailToCheck}`);
      if (!storedPasswordHash) {
        throw new Error("Account not found. Please check your email or create a new account.");
      }
      
      const providedPasswordHash = btoa(credentials.password);
      if (storedPasswordHash !== providedPasswordHash) {
        throw new Error("Invalid password. Please check your password and try again.");
      }
      
      // Load user data after successful authentication
      const savedProfileName = await AsyncStorage.getItem("profileName");
      const savedProfilePhone = await AsyncStorage.getItem("profilePhone");
      const savedProfileEmoji = await AsyncStorage.getItem("profileEmoji");
      
      // Set user data
      setProfileEmail(credentials.email);
      if (savedProfileName) setProfileName(savedProfileName);
      if (savedProfilePhone) setProfilePhone(savedProfilePhone);
      if (savedProfileEmoji) setProfileEmoji(savedProfileEmoji);
      
      setIsAuthenticated(true);
      await AsyncStorage.setItem("isAuthenticated", JSON.stringify(true));
      await AsyncStorage.setItem("profileEmail", credentials.email);
    } catch (error) {
      throw new Error(error.message || "Failed to sign in. Please try again.");
    }
  };

  const handleSignUp = async (userData, bypassDeletedCheck = false) => {
    try {
      // Check if this email was previously deleted and warn user (unless bypassing)
      if (!bypassDeletedCheck) {
        const emailToCheck = userData.email.toLowerCase();
        const deletedAccountsData = await AsyncStorage.getItem("@deleted_accounts");
        
        if (deletedAccountsData) {
          const deletedAccounts = JSON.parse(deletedAccountsData);
          const wasDeleted = deletedAccounts.find(account => account.email === emailToCheck);
          
          if (wasDeleted) {
            // Show warning but don't remove from deleted list yet
            throw new Error("INFO_DELETED_ACCOUNT_RECREATION: You previously deleted an account with this email. Creating a new account will start fresh with no previous data.");
          }
        }
      }
      
      // If we reach here, either no deleted account found or user confirmed recreation
      // Remove email from deleted accounts list if it exists
      const emailToCheck = userData.email.toLowerCase();
      const deletedAccountsData = await AsyncStorage.getItem("@deleted_accounts");
      if (deletedAccountsData) {
        const deletedAccounts = JSON.parse(deletedAccountsData);
        const updatedDeletedAccounts = deletedAccounts.filter(account => account.email !== emailToCheck);
        await AsyncStorage.setItem("@deleted_accounts", JSON.stringify(updatedDeletedAccounts));
      }
      
      // Store user data
      setProfileName(userData.name);
      setProfileEmail(userData.email);
      setProfilePhone(userData.phone);
      setProfileEmoji(userData.emoji);
      setIsAuthenticated(true);
      
      await AsyncStorage.setItem("isAuthenticated", JSON.stringify(true));
      await AsyncStorage.setItem("profileName", userData.name);
      await AsyncStorage.setItem("profileEmail", userData.email);
      await AsyncStorage.setItem("profilePhone", userData.phone);
      await AsyncStorage.setItem("profileEmoji", userData.emoji);
      
      // Store password hash for authentication 
      // TODO: Use proper hashing like bcrypt in production
      const passwordHash = btoa(userData.password);
      await AsyncStorage.setItem(`password_${userData.email.toLowerCase()}`, passwordHash);
    } catch (error) {
      throw new Error(error.message || "Failed to create account. Please try again.");
    }
  };

  const handleSignOut = async () => {
    setIsAuthenticated(false);
    await AsyncStorage.setItem("isAuthenticated", JSON.stringify(false));
  };

  const handleDataReset = () => {
    // Clear all app state data
    setBills([]);
    setFriends([]);
    setProfileName("");
    setProfileEmail("");
    setProfilePhone("");
    setProfileEmoji("👤");
  };

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
                        ? Colors.text.accent.dark
                        : Colors.primary
                      : darkMode
                      ? Colors.text.secondary.dark
                      : Colors.text.secondary.light
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
                        ? Colors.text.accent.dark
                        : Colors.primary
                      : darkMode
                      ? Colors.text.secondary.dark
                      : Colors.text.secondary.light,
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

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: darkMode ? Colors.background.dark : Colors.background.light
      }}>
        <Text style={{ 
          fontSize: 24, 
          fontWeight: '700',
          color: darkMode ? Colors.text.accent.dark : Colors.primary,
          marginBottom: 16
        }}>
          💰 Bill Buddy
        </Text>
        <Text style={{ 
          color: darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light 
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthScreen 
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        darkMode={darkMode}
      />
    );
  }

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
            onSignOut={handleSignOut}
            onDataReset={handleDataReset}
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
