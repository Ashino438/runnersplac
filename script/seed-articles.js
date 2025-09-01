// scripts/seed-articles.js
const { db, admin } = require('../firebase/admin');

(async () => {
  const id = 'pegasus41'; // shoeId/slug
  const html = `
    <h3>推しポイント</h3>
    <p>ジョグ〜Eペースに最適。踵着地でもブレにくい。</p>
    <h3>相性が微妙な人</h3>
    <p>フォアフットで厚底の反発を最大化したい人は上位モデルの方が合う。</p>
  `;
  await db.collection('articles').doc(id).set({
    html,
    author: 'Host',
    updatedAt: admin.firestore.Timestamp.now()
  }, { merge: true });
  console.log('seeded:', id);
  process.exit(0);
})();
