import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - you'll need to replace these with your actual config values
// Get these from Firebase Console > Project Settings > General > Your apps > Web app
const firebaseConfig = {
    apiKey: "AIzaSyD9z06PKtZws6Z2VWceU-kwVz34ua-eCBo",
    authDomain: "bus-6394e.firebaseapp.com",
    projectId: "bus-6394e",
    storageBucket: "bus-6394e.firebasestorage.app",
    messagingSenderId: "144208474881",
    appId: "1:144208474881:web:7e99fdac6936b82221e100"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
