import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import FriendsScreen from "./FriendsScreen";
import FriendDetailScreen from "./FriendDetailScreen";

const Stack = createStackNavigator();

export default function FriendsStackScreen({
  friends, // This prop is already passed to FriendsScreen, now pass to FriendDetailScreen too
  setFriends,
  bills,
  profileName,
  darkMode = false, // Add darkMode prop
}) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FriendsList">
        {(props) => (
          <FriendsScreen
            {...props}
            friends={friends}
            setFriends={setFriends}
            bills={bills}
            profileName={profileName}
            darkMode={darkMode} // Pass darkMode
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="FriendDetail">
        {(props) => (
          <FriendDetailScreen
            {...props}
            bills={bills}
            profileName={profileName}
            friends={friends} // <-- IMPORTANT: Pass the friends list here
            darkMode={darkMode} // Pass darkMode
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
