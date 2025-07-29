import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "./firebaseConfig";

/**
 * Production-ready Firebase Authentication Service
 * Handles user registration, login, profile management
 */

// Enhanced user registration with profile creation
export const registerUser = async (email, password, name, phone, emoji) => {
  try {
    // 1. Check if email already exists
    const existingUser = await checkEmailExists(email);
    if (existingUser) {
      throw new Error("An account with this email already exists.");
    }

    // 2. Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 3. Update Firebase Auth profile
    await updateProfile(user, {
      displayName: name
    });

    // 4. Save user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      email: email.toLowerCase(),
      phone,
      emoji,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      lastLoginAt: serverTimestamp()
    });

    // 5. Cache user data locally for offline access
    await AsyncStorage.setItem('userProfile', JSON.stringify({
      uid: user.uid,
      name,
      email: email.toLowerCase(),
      phone,
      emoji
    }));

    console.log('User registered successfully:', user.uid);
    return {
      user,
      profile: { uid: user.uid, name, email: email.toLowerCase(), phone, emoji }
    };
  } catch (error) {
    console.error("Registration error:", error.message);
    
    // Enhanced error handling with user-friendly messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("An account with this email already exists. Please sign in instead.");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Password should be at least 6 characters long.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Please enter a valid email address.");
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error("Network error. Please check your internet connection.");
    }
    
    throw error;
  }
};

// Enhanced user login with profile fetching
export const loginUser = async (email, password) => {
  try {
    // 1. Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.toLowerCase(),
      password
    );
    const user = userCredential.user;

    // 2. Fetch user profile from Firestore
    const profileDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!profileDoc.exists()) {
      throw new Error("User profile not found. Please contact support.");
    }

    const profile = profileDoc.data();

    // 3. Update last login timestamp
    await updateDoc(doc(db, "users", user.uid), {
      lastLoginAt: serverTimestamp(),
      isActive: true
    });

    // 4. Cache user data locally
    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));

    console.log('User logged in successfully:', user.uid);
    return { user, profile };
  } catch (error) {
    console.error("Login error:", error.message);
    
    // Enhanced error handling
    if (error.code === 'auth/user-not-found') {
      throw new Error("No account found with this email. Please check your email or create a new account.");
    } else if (error.code === 'auth/wrong-password') {
      throw new Error("Incorrect password. Please try again.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Please enter a valid email address.");
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error("Too many failed attempts. Please try again later.");
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error("Network error. Please check your internet connection.");
    }
    
    throw error;
  }
};

// Check if email already exists
export const checkEmailExists = async (email) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

// Enhanced logout with cleanup
export const logoutUser = async () => {
  try {
    const user = auth.currentUser;
    
    if (user) {
      // Update user status before logout
      await updateDoc(doc(db, "users", user.uid), {
        lastLoginAt: serverTimestamp(),
        isActive: false
      });
    }

    // Clear local cache
    await AsyncStorage.multiRemove([
      'userProfile',
      'bills',
      'friends',
      'groups'
    ]);

    // Firebase logout
    await signOut(auth);
    
    console.log('User logged out successfully');
  } catch (error) {
    console.error("Logout error:", error.message);
    throw new Error("Failed to log out. Please try again.");
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email.toLowerCase());
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error("Password reset error:", error.message);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error("No account found with this email address.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Please enter a valid email address.");
    }
    
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (updates) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found.");

    // Update Firebase Auth profile if name changed
    if (updates.name && updates.name !== user.displayName) {
      await updateProfile(user, { displayName: updates.name });
    }

    // Update Firestore profile
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "users", user.uid), updateData);

    // Update local cache
    const cachedProfile = await AsyncStorage.getItem('userProfile');
    if (cachedProfile) {
      const profile = JSON.parse(cachedProfile);
      const updatedProfile = { ...profile, ...updates };
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    }

    console.log('Profile updated successfully');
    return updateData;
  } catch (error) {
    console.error("Profile update error:", error.message);
    throw new Error("Failed to update profile. Please try again.");
  }
};

// Delete user account
export const deleteUserAccount = async (password) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found.");

    // Re-authenticate user before deletion (security requirement)
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Delete user data from Firestore
    await deleteDoc(doc(db, "users", user.uid));

    // Clear local storage
    await AsyncStorage.clear();

    // Delete Firebase Auth account
    await deleteUser(user);

    console.log('User account deleted successfully');
  } catch (error) {
    console.error("Account deletion error:", error.message);
    
    if (error.code === 'auth/wrong-password') {
      throw new Error("Incorrect password. Please try again.");
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error("Please log out and log back in before deleting your account.");
    }
    
    throw error;
  }
};

// Get current user profile
export const getCurrentUserProfile = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    // Try to get from cache first
    const cachedProfile = await AsyncStorage.getItem('userProfile');
    if (cachedProfile) {
      return JSON.parse(cachedProfile);
    }

    // Fetch from Firestore if not cached
    const profileDoc = await getDoc(doc(db, "users", user.uid));
    if (profileDoc.exists()) {
      const profile = profileDoc.data();
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      return profile;
    }

    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Auth state listener
export const setupAuthListener = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      const profile = await getCurrentUserProfile();
      callback({ user, profile, isAuthenticated: true });
    } else {
      // User is signed out
      callback({ user: null, profile: null, isAuthenticated: false });
    }
  });
};
