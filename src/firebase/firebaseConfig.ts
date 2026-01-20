// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAYhQebgwtkMD35Zpb-mjyMZ5D_4wxURys",
  authDomain: "yachtbooking-34dce.firebaseapp.com",
  projectId: "yachtbooking-34dce",
  storageBucket: "yachtbooking-34dce.firebasestorage.app",
  messagingSenderId: "878201914009",
  appId: "1:878201914009:web:09e69a7d93ea0f9fb8ae08",
  measurementId: "G-SL46P4VFHX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);