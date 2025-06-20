const express = require('express');
const router = express.Router();
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');
const collectionname="ratings_structure25"

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
    const snapshot = await getDocs(collection(db, collectionname));
    const allRatings = [];
    snapshot.forEach(doc => {
      allRatings.push(doc.data());
    });

    // 最後の投稿を「自分の評価」として使う（仮）
    const myRatings = allRatings[allRatings.length - 1]?.ratings || [];

    // 平均スコアの計算
    const sum = new Array(10).fill(0);
    const count = allRatings.length;

    allRatings.forEach(entry => {
      entry.ratings.forEach((score, i) => {
        sum[i] += score;
      });
    });

    const avgRatings = sum.map(total => +(total / count).toFixed(2));

    // 最新のコメントを6件取得（コメントがあるものだけ）
    const q = query(collection(db, collectionname), orderBy('createdAt', 'desc'), limit(10));
    const latestSnapshot = await getDocs(q);
    const recentComments = [];
    latestSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.comment && data.comment.trim() !== '') {
        recentComments.push(data.comment);
      }
    });

    res.render('result_structure25', {
      myRatings,
      avgRatings,
      recentComments: recentComments.slice(0, 6)|| [] // コメント6件に限定
    });
  } catch (err) {
    console.error('取得エラー:', err);
    res.status(500).send('エラーが発生しました');
  }
});

module.exports = router;
