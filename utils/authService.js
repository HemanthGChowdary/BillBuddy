import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export const registerUser = async (email, password, name, phone, emoji) => {
  try {
    // 1. Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 2. Save user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      phone,
      emoji,
      createdAt: serverTimestamp(),
    });

    return user; // return user for further use (like auto-login)
  } catch (error) {
    console.error("Error during signup:", error.message);
    throw error;
  }
};
