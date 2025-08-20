// routes/auth.js
const express = require('express');
const router = express.Router();
const { createSessionCookie } = require('../lib/session');

router.post('/api/sessionLogin', async (req,res)=>{
  const { idToken } = req.body || {};
  if(!idToken) return res.status(400).json({ok:false,msg:'no token'});
  const expiresIn = 1000*60*60*24*5; // 5日
  try{
    const cookie = await createSessionCookie(idToken, expiresIn);
    res.cookie('__session', cookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.json({ ok:true });
  }catch(e){
    res.status(401).json({ ok:false, msg: e.message });
  }
});

router.get('/login', (req, res) => {
  const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '/home2';
  res.render('login', { redirect });
});

router.get('/logout',(req,res)=>{
  res.clearCookie('__session', { path: '/' });
  res.redirect('/home2');
});

module.exports = router;

