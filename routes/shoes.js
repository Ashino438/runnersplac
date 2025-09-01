// routes/shoes.js
/*const express = require('express');
const path = require('path');
const router = express.Router();
const { db, admin } = require('../firebase/admin'); // ★ 追加：Firestore読む

const modPath = path.join(__dirname, '..', 'data', 'shoesData.js');

// 文字ゆれ正規化
const norm = s => String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'-');

function getShoes(refresh = false){
  if (refresh) delete require.cache[require.resolve(modPath)];
  const list = require(modPath);
  if (!Array.isArray(list)) throw new Error('shoesData.js must export an array');
  return list;
}

// Firestoreからホスト解説を取得
async function loadArticle(docId){
  try {
    const snap = await db.collection('articles').doc(String(docId)).get();
    if (!snap.exists) return null;
    const a = snap.data() || {};
    return {
      html: a.html || '',
      author: a.author || null,
      updatedAtISO: a.updatedAt?.toDate?.()?.toISOString() || null,
    };
  } catch (e) {
    console.error('[articles] read error:', e);
    return null;
  }
}

router.get('/:id', async (req, res) => {
  const want = norm(req.params.id);

  const list = getShoes(true);
  const shoe = list.find(s => norm(s.id) === want || norm(s.slug||s.name) === want);
  if (!shoe) return res.status(404).send('Not Found');

  // 表示用の細かい整形（任意）
  if (shoe.price && typeof shoe.price === 'number') shoe.price = shoe.price; // そのまま
  if (shoe.offset && !shoe.drop) shoe.drop = shoe.offset; // 表示名ゆれ補正

  // 記事ドキュメントID（基本は数値/文字列id、無ければslug）
  const docId = shoe.id ?? (shoe.slug ? norm(shoe.slug) : norm(shoe.name));

  // Firestoreから解説を読む
  const article = await loadArticle(docId);

  // EJSに渡す
  shoe.articleHtml = article?.html || shoe.articleHtml || ''; // 無ければ空で非表示
  shoe.articleAuthor = article?.author || null;
  shoe.articleUpdatedAt = article?.updatedAtISO || null;

  res.render('shoe-detail', {
    shoe,
    communityAvg: null,
    communityCount: 0
  });
});

module.exports = router;*/

// routes/shoes.js
const express = require('express');
const path = require('path');
const router = express.Router();
const { db } = require('../firebase/admin');

const modPath = path.join(__dirname, '..', 'data', 'shoesData.js');
const norm = s => String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'-');

function getShoes(refresh=false){
  if (refresh) delete require.cache[require.resolve(modPath)];
  const list = require(modPath);
  if (!Array.isArray(list)) throw new Error('shoesData.js must export an array');
  return list;
}

async function loadArticle(docId){
  const snap = await db.collection('articles').doc(String(docId)).get();
  console.log('[articles] docId=', docId, 'exists=', snap.exists); // ← ②ここがログ
  if (!snap.exists) return null;
  const a = snap.data() || {};
  return {
    html: a.html || '',
    author: a.author || null,
    updatedAtISO: a.updatedAt?.toDate?.()?.toISOString() || null,
  };
}

router.get('/:id', async (req, res, next) => {
  try{
    const want = norm(req.params.id);
    const list = getShoes(true);
    const shoe = list.find(s => norm(s.id) === want || norm(s.slug||s.name) === want);
    if (!shoe) return res.status(404).send('Not Found');

    const docId = shoe.id ?? (shoe.slug ? norm(shoe.slug) : norm(shoe.name));
    console.log('[shoes] detail for', shoe.name, 'docId=', docId); // ← ②ここがログ

    // ①テスト文字を強制表示（まずEJSの表示確認）
    shoe.articleHtml = '<p style="color:#ff6b35">テスト：ここが見えたらEJSはOK</p>';

    // Firestoreから読んで差し替え（docが無ければテスト文字のまま）
    const article = await loadArticle(docId);
    if (article?.html) {
      shoe.articleHtml = article.html;
      shoe.articleAuthor = article.author || null;
      shoe.articleUpdatedAt = article.updatedAtISO || null;
    }

    // 記事を読み込んだ後
if (article?.isDraft && !(req.user?.isAdmin)) {
  shoe.articleHtml = ''; // 一般ユーザーには出さない
} else {
  shoe.articleHtml = article?.html || '';
}
shoe.articleAuthor = article?.author || null;
shoe.articleUpdatedAt = article?.updatedAtISO || null;


    res.render('shoe-detail', { shoe, communityAvg: null, communityCount: 0 });
  }catch(e){ next(e); }
});

module.exports = router;


