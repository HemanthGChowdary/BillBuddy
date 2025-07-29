import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Component,
} from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Image,
  ActionSheetIOS,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import { Colors, Typography, Spacing, BorderRadius } from "../styles/theme";
import { 
  requestCameraPermissionWithEducation, 
  requestMediaLibraryPermissionWithEducation 
} from "../utils/permissions";

// Error Boundary Component for crash protection
class ChatErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging (in production, send to crash reporting service)
    console.error("ChatScreen Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            backgroundColor: this.props.darkMode ? Colors.background.dark : Colors.background.light,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Ionicons
              name="chatbubble-outline"
              size={64}
              color={this.props.darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginTop: 16,
                marginBottom: 8,
                textAlign: "center",
                color: this.props.darkMode ? Colors.text.primary.dark : Colors.text.primary.light,
              }}
            >
              Chat Temporarily Unavailable
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: this.props.darkMode ? "#8B949E" : "#656D76",
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              We're having trouble loading the chat. Please go back and try
              again.
            </Text>
            <Pressable
              onPress={() => this.props.navigation?.goBack()}
              style={{
                backgroundColor: this.props.darkMode ? "#238636" : "#0969DA",
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Go Back
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Enhanced message status constants
const MESSAGE_STATUS = {
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
};

function ChatScreen({ route, navigation, darkMode = false }) {
  // Validate route params with fallbacks
  const {
    friendName = "Unknown Friend",
    friendEmoji = "👤",
    currentUser = "You",
  } = route?.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("online"); // online, offline, connecting
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lastSeen, setLastSeen] = useState("Active now");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachmentOptions, setAttachmentOptions] = useState([
    { id: "photos", name: "Photos", icon: "images", color: "#4A90E2", action: "pickImage" },
    { id: "camera", name: "Camera", icon: "camera", color: "#666666", action: "launchCamera" },
    { id: "location", name: "Location", icon: "location", color: "#4CAF50", action: "location" },
    { id: "splitbill", name: "Split Bill", icon: "receipt", color: "#FF9500", action: "splitbill" },
    { id: "payment", name: "Payment", icon: "card", color: "#34C759", action: "payment" },
    { id: "document", name: "Document", icon: "document-text", color: "#5856D6", action: "document" },
    { id: "voice", name: "Voice Note", icon: "mic", color: "#FF3B30", action: "voice" },
    { id: "contact", name: "Contact", icon: "person", color: "#8E8E93", action: "contact" },
  ]);
  const flatListRef = useRef(null);

  // Enhanced theme colors with better visual hierarchy
  const theme = {
    background: darkMode ? "#0D1117" : "#F6F8FA",
    cardBackground: darkMode ? "#161B22" : "#FFFFFF",
    inputBackground: darkMode ? "#21262D" : "#F6F8FA",
    textPrimary: darkMode ? "#F0F6FC" : "#24292F",
    textSecondary: darkMode ? "#8B949E" : "#656D76",
    primary: darkMode ? "#F78166" : "#D73A49",
    primaryPressed: darkMode ? "#EC6547" : "#B31D28",
    border: darkMode ? "#30363D" : "#D0D7DE",
    messageBubbleUser: darkMode ? "#238636" : "#0969DA",
    messageBubbleFriend: darkMode ? "#30363D" : "#F6F8FA",
    messageTextUser: "#FFFFFF",
    messageTextFriend: darkMode ? "#F0F6FC" : "#24292F",
    shadow: darkMode ? "rgba(0,0,0,0.6)" : "rgba(31,35,40,0.15)",
    timestampText: darkMode ? "rgba(240,246,252,0.6)" : "rgba(36,41,47,0.6)",
    statusSuccess: "#22C55E",
    statusWarning: "#F59E0B",
    statusError: "#EF4444",
  };

  // Load messages on component mount
  useEffect(() => {
    initializeChat();
  }, [friendName, currentUser]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Enhanced initialization with error handling
  const initializeChat = async () => {
    try {
      setIsLoading(true);
      await loadMessages();
      setConnectionStatus("online");
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      setConnectionStatus("offline");
      Alert.alert(
        "Connection Error",
        "Unable to load chat messages. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const chatKey = getChatKey(currentUser, friendName);
      const saved = await AsyncStorage.getItem(`chat_${chatKey}`);
      if (saved) {
        const parsedMessages = JSON.parse(saved);
        // Validate message structure
        const validMessages = parsedMessages.filter(
          (msg) => msg && msg.id && msg.text && msg.sender && msg.timestamp
        );
        setMessages(validMessages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      throw error;
    }
  };

  const saveMessages = async (newMessages) => {
    try {
      const chatKey = getChatKey(currentUser, friendName);
      await AsyncStorage.setItem(
        `chat_${chatKey}`,
        JSON.stringify(newMessages)
      );
    } catch (error) {
      console.error("Failed to save messages:", error);
      // Don't throw here to prevent UI disruption
    }
  };

  const getChatKey = (user1, user2) => {
    return [user1, user2].sort().join("_");
  };

  // Enhanced send message with retry logic
  const sendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    const tempId = `temp_${Date.now()}`;

    // Create optimistic message
    const newMessage = {
      id: tempId,
      text: messageText,
      sender: currentUser,
      timestamp: Date.now(),
      status: MESSAGE_STATUS.SENDING,
      isRead: false,
    };

    // Add message optimistically
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputText("");

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update message status to sent
      const finalMessage = {
        ...newMessage,
        id: Date.now().toString(), // Replace temp ID
        status: MESSAGE_STATUS.SENT,
      };

      const finalMessages = updatedMessages.map((msg) =>
        msg.id === tempId ? finalMessage : msg
      );

      setMessages(finalMessages);
      await saveMessages(finalMessages);

      // Simulate delivery status after a delay
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === finalMessage.id
              ? { ...msg, status: MESSAGE_STATUS.DELIVERED }
              : msg
          )
        );
      }, 1000);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Update message status to failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: MESSAGE_STATUS.FAILED } : msg
        )
      );
    }
  }, [inputText, messages, currentUser]);

  // Image handling functions - using new permission utility

  const handleImagePicker = async () => {
    // Direct library access with proper permission education
    const hasPermission = await requestMediaLibraryPermissionWithEducation('send photos in chat');
    if (!hasPermission) return;

    pickImage();
  };

  const launchCamera = async () => {
    try {
      const hasPermission = await requestCameraPermissionWithEducation('take photos for chat');
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.5,
        allowsMultipleSelection: false,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Unable to access camera. Please try again.");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.5,
        allowsMultipleSelection: false,
        exif: false,
        base64: false,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets?.[0]) {
        sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Library error:", error);
      Alert.alert("Error", "Unable to access photo library. Please try again.");
    }
  };

  const sendImageMessage = useCallback(
    async (imageUri) => {
      const tempId = `temp_${Date.now()}`;

      const newMessage = {
        id: tempId,
        type: "image",
        imageUri: imageUri,
        sender: currentUser,
        timestamp: Date.now(),
        status: MESSAGE_STATUS.SENDING,
        isRead: false,
      };

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const finalMessage = {
          ...newMessage,
          id: Date.now().toString(),
          status: MESSAGE_STATUS.SENT,
        };

        const finalMessages = updatedMessages.map((msg) =>
          msg.id === tempId ? finalMessage : msg
        );

        setMessages(finalMessages);
        await saveMessages(finalMessages);

        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === finalMessage.id
                ? { ...msg, status: MESSAGE_STATUS.DELIVERED }
                : msg
            )
          );
        }, 1000);
      } catch (error) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: MESSAGE_STATUS.FAILED } : msg
          )
        );
      }
    },
    [messages, currentUser]
  );

  // Document picker function
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const document = result.assets[0];
        Alert.alert(
          "Document Selected",
          `Selected: ${document.name}\nSize: ${(document.size / 1024 / 1024).toFixed(2)} MB`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Send", onPress: () => sendDocumentMessage(document) }
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Unable to pick document. Please try again.");
    }
  };

  const sendDocumentMessage = useCallback(async (document) => {
    const tempId = `temp_${Date.now()}`;

    const newMessage = {
      id: tempId,
      type: "document",
      document: document,
      text: `📄 ${document.name}`,
      sender: currentUser,
      timestamp: Date.now(),
      status: MESSAGE_STATUS.SENDING,
      isRead: false,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const finalMessage = {
        ...newMessage,
        id: Date.now().toString(),
        status: MESSAGE_STATUS.SENT,
      };

      const finalMessages = updatedMessages.map((msg) =>
        msg.id === tempId ? finalMessage : msg
      );

      setMessages(finalMessages);
      await saveMessages(finalMessages);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === finalMessage.id
              ? { ...msg, status: MESSAGE_STATUS.DELIVERED }
              : msg
          )
        );
      }, 1000);
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: MESSAGE_STATUS.FAILED } : msg
        )
      );
    }
  }, [messages, currentUser]);

  // Handle attachment actions
  const handleAttachmentAction = (action) => {
    setShowAttachmentMenu(false);
    
    setTimeout(() => {
      switch (action) {
        case "pickImage":
          pickImage();
          break;
        case "launchCamera":
          launchCamera();
          break;
        case "location":
          Alert.alert("Location", "Share your current location");
          break;
        case "splitbill":
          Alert.alert("Split Bill", "Create a new bill to split with your friend");
          break;
        case "payment":
          Alert.alert("Payment", "Send or request money");
          break;
        case "document":
          pickDocument();
          break;
        case "voice":
          Alert.alert("Voice Note", "Record a voice message");
          break;
        case "contact":
          Alert.alert("Contact", "Share a contact");
          break;
        default:
          break;
      }
    }, 200);
  };

  // Drag and drop reorder function
  const moveAttachmentOption = (dragIndex, hoverIndex) => {
    const draggedOption = attachmentOptions[dragIndex];
    const newOptions = [...attachmentOptions];
    newOptions.splice(dragIndex, 1);
    newOptions.splice(hoverIndex, 0, draggedOption);
    setAttachmentOptions(newOptions);
  };

  // Retry failed message
  const retryMessage = useCallback(
    async (messageId) => {
      const message = messages.find((msg) => msg.id === messageId);
      if (!message || message.status !== MESSAGE_STATUS.FAILED) return;

      // Update status to sending
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, status: MESSAGE_STATUS.SENDING }
            : msg
        )
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update to sent
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, status: MESSAGE_STATUS.SENT } : msg
          )
        );
      } catch (error) {
        // Update back to failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, status: MESSAGE_STATUS.FAILED }
              : msg
          )
        );
      }
    },
    [messages]
  );

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid time";
    }
  };

  // Enhanced message status indicator
  const getMessageStatusIcon = (status) => {
    switch (status) {
      case MESSAGE_STATUS.SENDING:
        return (
          <Ionicons name="time-outline" size={12} color={theme.timestampText} />
        );
      case MESSAGE_STATUS.SENT:
        return (
          <Ionicons
            name="checkmark-outline"
            size={12}
            color={theme.timestampText}
          />
        );
      case MESSAGE_STATUS.DELIVERED:
        return (
          <Ionicons
            name="checkmark-done-outline"
            size={12}
            color={theme.statusSuccess}
          />
        );
      case MESSAGE_STATUS.READ:
        return (
          <Ionicons
            name="checkmark-done-outline"
            size={12}
            color={theme.statusSuccess}
          />
        );
      case MESSAGE_STATUS.FAILED:
        return (
          <Ionicons name="alert-circle" size={12} color={theme.statusError} />
        );
      default:
        return null;
    }
  };

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.sender === currentUser;
    const prevMessage = messages[index - 1];
    const isFirstInGroup = !prevMessage || prevMessage.sender !== item.sender;
    const isLastInGroup =
      !messages[index + 1] || messages[index + 1].sender !== item.sender;

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: isCurrentUser ? "flex-end" : "flex-start",
          marginBottom: isLastInGroup ? 16 : 2,
          paddingHorizontal: 16,
          marginTop: isFirstInGroup ? 8 : 0,
        }}
      >
        {!isCurrentUser && (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.primary,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 10,
              opacity: isLastInGroup ? 1 : 0,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 18 }}>{friendEmoji}</Text>
          </View>
        )}

        <View
          style={{
            maxWidth: "75%",
            alignItems: isCurrentUser ? "flex-end" : "flex-start",
          }}
        >
          <Pressable
            onPress={() => {
              if (item.type === "image" && item.imageUri) {
                setSelectedImage(item.imageUri);
                setShowImageViewer(true);
              } else if (
                item.status === MESSAGE_STATUS.FAILED &&
                isCurrentUser
              ) {
                Alert.alert(
                  "Message Failed",
                  "This message failed to send. Would you like to try again?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Retry",
                      onPress: () => retryMessage(item.id),
                    },
                  ]
                );
              }
            }}
            style={{
              backgroundColor: isCurrentUser
                ? theme.messageBubbleUser
                : theme.messageBubbleFriend,
              borderRadius: 20,
              paddingHorizontal: item.type === "image" ? 4 : 16,
              paddingVertical: item.type === "image" ? 4 : 12,
              borderTopLeftRadius: isCurrentUser ? 20 : isFirstInGroup ? 20 : 6,
              borderTopRightRadius: isCurrentUser
                ? isFirstInGroup
                  ? 20
                  : 6
                : 20,
              borderBottomLeftRadius: isCurrentUser
                ? 20
                : isLastInGroup
                ? 6
                : 20,
              borderBottomRightRadius: isCurrentUser
                ? isLastInGroup
                  ? 6
                  : 20
                : 20,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
              opacity: item.status === MESSAGE_STATUS.FAILED ? 0.7 : 1,
            }}
          >
            {item.type === "image" ? (
              <View>
                <Image
                  source={{ uri: item.imageUri }}
                  style={{
                    width: 200,
                    height: 150,
                    borderRadius: 16,
                    backgroundColor: theme.border,
                  }}
                  resizeMode="cover"
                />
                {item.status === MESSAGE_STATUS.SENDING && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.3)",
                      borderRadius: 16,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="time-outline" size={24} color="#FFFFFF" />
                  </View>
                )}
              </View>
            ) : (
              <Text
                style={{
                  color: isCurrentUser
                    ? theme.messageTextUser
                    : theme.messageTextFriend,
                  fontSize: 16,
                  lineHeight: 22,
                  fontWeight: "400",
                }}
              >
                {item.text}
              </Text>
            )}
          </Pressable>

          {isLastInGroup && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
                marginHorizontal: 4,
              }}
            >
              <Text
                style={{
                  color: theme.timestampText,
                  fontSize: 11,
                  fontWeight: "500",
                  marginRight: isCurrentUser ? 4 : 0,
                }}
              >
                {formatTime(item.timestamp)}
              </Text>
              {isCurrentUser && getMessageStatusIcon(item.status)}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          marginBottom: 12,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.primary,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>{friendEmoji}</Text>
        </View>

        <View
          style={{
            backgroundColor: theme.messageBubbleFriend,
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomLeftRadius: 4,
          }}
        >
          <Text
            style={{
              color: theme.messageTextFriend,
              fontSize: 16,
              fontStyle: "italic",
            }}
          >
            {friendName} is typing...
          </Text>
        </View>
      </View>
    );
  };

  // Enhanced connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "online":
        return theme.statusSuccess;
      case "connecting":
        return theme.statusWarning;
      case "offline":
        return theme.statusError;
      default:
        return theme.textSecondary;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "online":
        return "Online";
      case "connecting":
        return "Connecting...";
      case "offline":
        return "Offline";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar
          barStyle={darkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={48}
            color={theme.textSecondary}
          />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: theme.textSecondary,
            }}
          >
            Loading chat...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Enhanced Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: theme.cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 16,
            backgroundColor: pressed ? theme.border : "transparent",
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>

        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.primary,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 16,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 20 }}>{friendEmoji}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: theme.textPrimary,
              marginBottom: 2,
            }}
          >
            {friendName}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: getConnectionStatusColor(),
                marginRight: 6,
              }}
            />
            <Text
              style={{
                fontSize: 13,
                color: theme.textSecondary,
                fontWeight: "500",
              }}
            >
              {connectionStatus === "online"
                ? lastSeen
                : getConnectionStatusText()}
            </Text>
          </View>
        </View>

        {/* Header action buttons */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Voice Call", `Calling ${friendName}...`);
            }}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 8,
              backgroundColor: pressed ? theme.border : "transparent",
            })}
          >
            <Ionicons name="call-outline" size={20} color={theme.textPrimary} />
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Video Call", `Video calling ${friendName}...`);
            }}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: pressed ? theme.border : "transparent",
            })}
          >
            <Ionicons
              name="videocam-outline"
              size={20}
              color={theme.textPrimary}
            />
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingTop: 16,
                paddingBottom: 8,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={renderTypingIndicator}
              ListEmptyComponent={() => (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 32,
                  }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: theme.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons
                      name="chatbubbles"
                      size={40}
                      color={theme.primary}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: theme.textPrimary,
                      textAlign: "center",
                      marginBottom: 8,
                    }}
                  >
                    Start your conversation
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.textSecondary,
                      textAlign: "center",
                      lineHeight: 20,
                    }}
                  >
                    Send a message to {friendName} to get the conversation
                    started!
                  </Text>
                </View>
              )}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={20}
            />

            {/* Enhanced Input Area */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: theme.cardBackground,
                borderTopWidth: 1,
                borderTopColor: theme.border,
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {/* Plus/Attachment button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAttachmentMenu(true);
                }}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 10,
                  backgroundColor: pressed ? theme.border : "transparent",
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={theme.textSecondary}
                />
              </Pressable>

              {/* Text input container with send button */}
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: theme.inputBackground,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingLeft: 16,
                  paddingRight: 4,
                  paddingVertical: 4,
                  marginRight: 8,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    color: theme.textPrimary,
                    fontSize: 16,
                    lineHeight: 20,
                    paddingVertical: 10,
                    maxHeight: 100,
                  }}
                  placeholder="Type a message..."
                  placeholderTextColor={theme.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  textAlignVertical="center"
                  maxLength={1000}
                  onFocus={() => {
                    setTimeout(() => {
                      setIsTyping(true);
                      setTimeout(() => setIsTyping(false), 3000);
                    }, 2000);
                  }}
                />
                
                {/* Send button inside input */}
                {inputText.trim() ? (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      sendMessage();
                    }}
                    style={({ pressed }) => ({
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: theme.messageBubbleUser,
                      justifyContent: "center",
                      alignItems: "center",
                      marginLeft: 8,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    })}
                  >
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                  </Pressable>
                ) : null}
              </View>

              {/* Emoji button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert("Emojis", "Emoji keyboard coming soon!");
                }}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 8,
                  backgroundColor: pressed ? theme.border : "transparent",
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <Ionicons
                  name="happy-outline"
                  size={22}
                  color={theme.textSecondary}
                />
              </Pressable>

              {/* GIF/Sticker button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert("GIFs & Stickers", "GIF library coming soon!");
                }}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: pressed ? theme.border : "transparent",
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={22}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Attachment Menu Modal */}
      <Modal
        visible={showAttachmentMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setShowAttachmentMenu(false)}
        >
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View
                style={{
                  backgroundColor: theme.cardBackground,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 40,
                }}
              >
                {/* Handle bar */}
                <View
                  style={{
                    width: 40,
                    height: 4,
                    backgroundColor: theme.border,
                    borderRadius: 2,
                    alignSelf: "center",
                    marginBottom: 20,
                  }}
                />

                {/* Attachment options grid */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-around",
                  }}
                >
                  {attachmentOptions.map((option, index) => (
                    <Pressable
                      key={option.id}
                      onPress={() => handleAttachmentAction(option.action)}
                      onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        Alert.alert(
                          "Reorder Icons",
                          "Long press and drag to reorder attachment options (feature coming soon!)"
                        );
                      }}
                      style={{ 
                        alignItems: "center",
                        width: "25%",
                        marginBottom: index < 4 ? 30 : 0,
                      }}
                    >
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: option.color,
                          justifyContent: "center",
                          alignItems: "center",
                          marginBottom: 8,
                          shadowColor: option.color,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Ionicons name={option.icon} size={28} color="#FFFFFF" />
                      </View>
                      <Text style={{ 
                        color: theme.textPrimary, 
                        fontSize: 12, 
                        fontWeight: "500",
                        textAlign: "center",
                      }}>
                        {option.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => setShowImageViewer(false)}
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{
                width: "90%",
                height: "70%",
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// PropTypes for development safety
ChatScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      friendName: PropTypes.string,
      friendEmoji: PropTypes.string,
      currentUser: PropTypes.string,
    }),
  }).isRequired,
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  darkMode: PropTypes.bool,
};

ChatScreen.defaultProps = {
  darkMode: false,
};

// Wrapped component with Error Boundary
export default function ChatScreenWithErrorBoundary(props) {
  return (
    <ChatErrorBoundary darkMode={props.darkMode} navigation={props.navigation}>
      <ChatScreen {...props} />
    </ChatErrorBoundary>
  );
}
