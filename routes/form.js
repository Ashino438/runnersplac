// routes/form.js
const express = require('express');
const router = express.Router();
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

router.get('/', (req, res) => {
  res.render('form');
});

router.post('/submit', async (req, res) => {
  try {
    const { ratings, comment } = req.body;

    await addDoc(collection(db, 'ratings'), {
      ratings,
      comment,
      createdAt: new Date()
    });

    res.status(200).json({ message: '成功' });
  } catch (err) {
    console.error('エラー:', err);
    res.status(500).json({ message: 'サーバーエラー' });
  }
});

module.exports = router;
