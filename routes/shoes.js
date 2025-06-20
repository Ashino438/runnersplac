const express = require('express');
const router = express.Router();
router.get('/:id', async (req, res) => {
  const shoeId = req.params.id;

  const shoes = require('../data/shoesData');
  // 仮データ or DBから取得（例として配列検索）
  const shoe = shoes.find(s => s.id === shoeId);
  if (!shoe) return res.status(404).render('404');

  res.render('shoe-detail', { shoe });
});

module.exports = router;