 import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

document.getElementById('ratingForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const formData = new FormData(e.target);
    const ratings = [];
    const COLLECTION_NAME="ratings_vomero18"
  
    for (let i = 0; i < 10; i++) {
      const val = formData.get(`category${i}`);
      ratings.push(Number(val));
    }
  
    const comment = formData.get('comment');
  
    const payload = {
      ratings: ratings,
      comment: comment
    };

   
const firebaseConfig = {
  apiKey: "AIzaSyBbFaRwIiYw61X5yKXhvt1nGw-MRSgagLo",
  authDomain: "mystlide.firebaseapp.com",
  projectId: "mystlide",
  storageBucket: "mystlide.firebasestorage.app",
  messagingSenderId: "823773802251",
  appId: "1:823d531f428f02f463fc0e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const snapshot = await getDocs(collection(db, COLLECTION_NAME));

let total = Array(10).fill(0);
let count = 0;

snapshot.forEach(doc => {
  const data = doc.data();
  if (data.ratings) {
    data.ratings.forEach((score, i) => {
      total[i] += score;
    });
    count++;
  }
});

const avgRatings = total.map(t => +(t / count).toFixed(2));

// あとは avgRatings を Chart.js に渡して表示すればOK！
console.log("form.js開始");
  
    try {
      const res = await fetch('/form_vomero18/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
     
  
      if (res.ok) {
        window.location.href = '/result_vomero18'; // 結果ページへリダイレクト
      } else {
        alert('送信に失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました');
    }
  });
console.log("form.js動いたよ"); // ← ← ← ← ← この行を**一番最後に置く！**
  

  