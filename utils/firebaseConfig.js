// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCJMyEQ1krTTlD97wtuCov5MPpZ_2l_lZ0",
  authDomain: "billbuddyai-b568e.firebaseapp.com",
  projectId: "billbuddyai-b568e",
  storageBucket: "billbuddyai-b568e.firebasestorage.app",
  messagingSenderId: "954743067750",
  appId: "1:954743067750:web:d44e19fde369da29e109a7",
  measurementId: "G-RW4H3D7J7M",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
