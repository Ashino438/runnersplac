/*
const express = require('express');
const router = express.Router();
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');



const db = require('../firebase/config.js'); // ←Firebaseインスタンス
const COLLECTION_NAME = 'ratings_pegasus41';
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

module.exports = router;*/

const express = require('express');
const router = express.Router();
const { db } = require('../firebase/admin'); // ← Admin SDK で作ったやつ
const COLLECTION_NAME = 'ratings_structure25'; // コレクション名は自由に変えてOK

// GET /form → 評価フォームを表示（必要なら平均計算）
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const ratings = snapshot.docs.map(doc => doc.data());

    const numCategories = 10;
    const totals = Array(numCategories).fill(0);
    let count = 0;

    ratings.forEach(r => {
      if (r.ratings && r.ratings.length === numCategories) {
        r.ratings.forEach((val, i) => {
          totals[i] += parseInt(val || 0);
        });
        count++;
      }
    });

    const averageRatings = count === 0
      ? Array(numCategories).fill(0)
      : totals.map(t => (t / count).toFixed(2));

    res.render('form_vomero18', {
      categories: [
        "クッション性", "安定性", "軽さ", "コスパ", "履き心地（フィット感）",
        "デザイン", "通気性", "スピード性能", "グリップ", "耐久性"
      ],
      averageRatings,
      voteCount: count
    });
  } catch (err) {
    console.error('GET /form エラー:', err);
    res.status(500).send('フォーム読み込みエラー');
  }
});

// POST /form/submit → 投票データを受け取って保存
router.post('/submit', async (req, res) => {
  try {
    const { ratings, comment } = req.body;

    if (!Array.isArray(ratings) || ratings.length !== 10) {
      return res.status(400).json({ message: '評価データが不正です' });
    }

    await db.collection(COLLECTION_NAME).add({
      ratings,
      comment,
      createdAt: new Date()
    });

    res.status(200).json({ message: '保存成功' });
  } catch (err) {
    console.error('POST /form_vomero18/submit エラー:', err);
    res.status(500).json({ message: 'サーバーエラー' });
  }
});

module.exports = router;

