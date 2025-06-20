// firebase/config.js

const firebaseConfig = {
  apiKey: "AIzaSyBbFaRwIiYw61X5yKXhvt1nGw-MRSgagLo",
  authDomain: "mystlide.firebaseapp.com",
  databaseURL: "https://mystlide-default-rtdb.firebaseio.com",
  projectId: "mystlide",
  storageBucket: "mystlide.firebasestorage.app",
  messagingSenderId: "823773802251",
  appId: "1:823773802251:web:823d531f428f02f463fc0e",
  measurementId: "G-E2V49FQSMX"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();