// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyBptovm7ABoh0b7lLrg0ITOPSAJCbqohkY",
  authDomain: "catering-2e591.firebaseapp.com",
  projectId: "catering-2e591",
  storageBucket: "catering-2e591.firebasestorage.app",
  messagingSenderId: "26890598108",
  appId: "1:26890598108:web:f80f5a3bf510b9d1f5e619"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();