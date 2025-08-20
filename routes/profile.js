const express = require('express');
const router = express.Router();
const { requireAuth } = require('../lib/session');
const { readProf, writeProf } = require('../lib/data');

router.get('/profile', (req,res)=>{
  const user = res.locals.user;
  const profiles = readProf();
  const me = user ? profiles[user.uid] : null;
  res.render('profile', { me, user, current:'profile' });
});

router.post('/profile', requireAuth(), (req,res)=>{
  const { nickname='', foot='レギュラー', arch='普通', goalPace='', favCushion='', favBrand='' } = req.body||{};
  const profiles = readProf();
  profiles[req.user.uid] = { nickname, foot, arch, goalPace, favCushion, favBrand, updatedAt: Date.now() };
  writeProf(profiles);
  res.json({ok:true});
});

module.exports = router;
