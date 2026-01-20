import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAYhQebgwtkMD35Zpb-mjyMZ5D_4wxURys",
  authDomain: "yachtbooking-34dce.firebaseapp.com",
  projectId: "yachtbooking-34dce",
  storageBucket: "yachtbooking-34dce.firebasestorage.app",
  messagingSenderId: "878201914009",
  appId: "1:878201914009:web:f59983b820b7370eb8ae08",
  measurementId: "G-THHDMW3LFP"
};''
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
