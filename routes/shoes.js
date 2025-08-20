// routes/shoes.js
const express = require('express');
const path = require('path');
const router = express.Router();

const modPath = path.join(__dirname, '..', 'data', 'shoesData.js');

// 文字ゆれ対策の軽い正規化（任意）
const norm = s => String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'-');

function getShoes(refresh = false){
  if (refresh) delete require.cache[require.resolve(modPath)];
  const list = require(modPath);
  if (!Array.isArray(list)) throw new Error('shoesData.js must export an array');
  return list;
}

router.get('/:id', (req, res) => {
  const want = norm(req.params.id);

  const list = getShoes(true); // ←毎回最新
  const shoe = list.find(s => norm(s.id) === want || norm(s.slug||s.name) === want);

  if (!shoe) {
    // 404テンプレが無ければ send にしておく
    return res.status(404).send('Not Found');
    // あるなら → res.status(404).render('404');
  }

  shoe.articleHtml = shoe.articleHtml || '<p>…</p>';
  res.render('shoe-detail', { shoe, communityAvg: null, communityCount: 0 });
});

module.exports = router;
