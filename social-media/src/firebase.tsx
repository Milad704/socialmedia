// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // <-- Import getFirestore here
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDc2GXUjj2pt9D7cmsKGCYFbQeim7-HTpU",
  authDomain: "socialmediaapp-170ea.firebaseapp.com",
  projectId: "socialmediaapp-170ea",
  storageBucket: "socialmediaapp-170ea.appspot.com",
  messagingSenderId: "874225109606",
  appId: "1:874225109606:web:d042112d8a9ba726c27ba7",
  measurementId: "G-SXRNB6ZM3P",
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
