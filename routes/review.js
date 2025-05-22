const express = require('express');
const router = express.Router();
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

router.get('/', async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, 'ratings'));
    const reviews = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString('ja-JP') : '不明';
      reviews.push({
        ratings: data.ratings,
        comment: data.comment,
        createdAt: date
      });
    });

    res.render('review', { reviews });
  } catch (err) {
    console.error('レビュー取得エラー:', err);
    res.status(500).send('エラーが発生しました');
  }
});

module.exports = router;
