// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyDhXd4IcFAtMt3Rsl7Opp9v6N6PuHQIW14",
  authDomain: "student-930a7.firebaseapp.com",
  projectId: "student-930a7",
  storageBucket: "student-930a7.firebasestorage.app",
  messagingSenderId: "644296529704",
  appId: "1:644296529704:web:e5c4d7eb3f81998a25221d"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
