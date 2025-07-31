// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCyffcCt4y_PqIkatjtshtukWJftxqJXM",
  authDomain: "sofilu-ecommerce.firebaseapp.com",
  projectId: "sofilu-ecommerce",
  storageBucket: "sofilu-ecommerce.firebasestorage.app",
  messagingSenderId: "111482082352",
  appId: "1:111482082352:web:641d8709858152a60149f5",
  measurementId: "G-540KE76XXS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);