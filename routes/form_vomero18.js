// routes/form.js
const express = require('express');
const router = express.Router();
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');



const db = require('../firebase/config.js'); // ←Firebaseインスタンス
const COLLECTION_NAME = 'ratings_vomero18';
router.get('/form', async (req, res) => {
 const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const ratings = snapshot.docs.map(doc => doc.data());

  const numCategories = 10;
  const totals = Array(numCategories).fill(0);
  let count = 0;

  ratings.forEach(r => {
    for (let i = 0; i < numCategories; i++) {
      totals[i] += parseInt(r[`category${i}`] || 0);
    }
    count++;
  });

  const averageRatings = count === 0 ? Array(numCategories).fill(0) : totals.map(t => (t / count).toFixed(2));

  res.render('form', {
    categories: [
      "クッション性", "安定性", "軽さ", "コスパ", "履き心地（フィット感）",
      "デザイン", "通気性", "スピード性能", "グリップ", "耐久性"
    ],
    averageRatings,
    voteCount: count
  });
});



router.get('/', (req, res) => {
  res.render('form');
});

router.post('/submit', async (req, res) => {
  try {
    const { ratings, comment } = req.body;

    await addDoc(collection(db, COLLECTION_NAME),  {
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
