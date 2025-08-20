// routes/wishlist.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../lib/session');
const { admin, db } = require('../firebase/admin');
const { shoes, byId } = require('../lib/data');

router.post('/api/wishlist', requireAuth(), async (req,res)=>{
  try{
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ ok:false, msg:'no id' });
    const base = byId[String(id)] || null;

    await db.collection('users').doc(req.user.uid)
      .collection('wishlist').doc(String(id))
      .set({
        id: String(id),
        name:  base?.name  ?? null,
        image: base?.image ?? null,
        brand: base?.brand ?? null,
        weight: base?.weight ?? null,
        drop:   base?.drop ?? null,
        price:  base?.price ?? null,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge:true });

    res.json({ ok:true });
  }catch(e){
    res.status(500).json({ ok:false, msg:String(e?.message||e) });
  }
});

// 一覧
router.get('/wishlist', async (req,res)=>{
  const u = res.locals.user;
  if(!u) return res.redirect('/login?redirect=' + encodeURIComponent('/wishlist'));

  const snap = await db.collection('users').doc(u.uid).collection('wishlist').orderBy('addedAt','desc').get();
  const items = snap.docs.map(d=>{
    const data = d.data() || {};
    const shoe = byId[String(data.id)] || null;
    const display = {
      name:  shoe?.name  ?? data.name  ?? data.id,
      image: shoe?.image ?? data.image ?? '/img/placeholder-shoe.jpg',
      brand: shoe?.brand ?? data.brand ?? null,
      weight: shoe?.weight ?? data.weight ?? null,
      drop:   shoe?.drop ?? data.drop ?? null,
      price:  shoe?.price ?? data.price ?? null,
      link: `/shoes/${data.id}`
    };
    return { key: String(data.id || d.id), display };
  });

  res.render('wishlist', { items, user: u });
});

router.post('/api/wishlist/remove', requireAuth(), async (req,res)=>{
  try{
    const { key } = req.body || {};
    if(!key) return res.status(400).json({ ok:false, msg:'no key' });
    await db.collection('users').doc(req.user.uid).collection('wishlist').doc(String(key)).delete();
    res.json({ ok:true });
  }catch(e){
    res.status(500).json({ ok:false, msg:String(e?.message||e) });
  }
});

module.exports = router;
