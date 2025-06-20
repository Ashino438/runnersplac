const express = require('express');
const router = express.Router();
// shoes配列（ダミーデータOK）

const shoes = require('../data/shoesData');
router.get('/', (req, res) => {
  res.render('home', {shoes}); // shoesは空でもOK
});




module.exports = router;
