// routes/admin.articles.js
const express = require('express');
const router = express.Router();
const { db, admin } = require('../firebase/admin');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB
});
const bucket = admin.storage().bucket();

// ここは自分の認証に合わせて。req.user?.isAdmin を想定
function requireAdmin(req, res, next){
    if (req.user?.isAdmin) return next();
    return res.status(403).send('forbidden');
  }
  


// 編集フォーム
router.get('/admin/articles/:shoeId', requireAdmin, async (req, res) => {
  const id = String(req.params.shoeId);
  const snap = await db.collection('articles').doc(id).get();
  const doc = snap.exists ? snap.data() : { html:'', author:'', isDraft:true };
  res.render('admin-article-edit', { shoeId: id, doc });
});

router.post('/admin/articles/:shoeId/image',
  requireAdmin,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ ok:false, msg:'no file' });
      const mime = req.file.mimetype;
      if (!/^image\/(png|jpe?g|webp|gif)$/i.test(mime)) {
        return res.status(400).json({ ok:false, msg:'invalid mime' });
      }

      const ext = mime.split('/')[1].replace('jpeg','jpg');
      const dest = `articles/${req.params.shoeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const file = bucket.file(dest);

      await file.save(req.file.buffer, {
        contentType: mime,
        resumable: false,
        metadata: { cacheControl: 'public,max-age=31536000' },
      });

      
 // 公開URLにする場合（バケット公開運用）
      // await file.makePublic();
      // const url = `https://storage.googleapis.com/${bucket.name}/${dest}`;

      // 署名URLにする場合（期限は必要に応じて調整）
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7
      });

      res.json({ ok:true, url });
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok:false, msg:'upload failed' });
    }
  }
);


// 保存（新規でも自動作成される）
router.post('/admin/articles/:shoeId', requireAdmin, async (req, res) => {
  const id = String(req.params.shoeId);
  const window = (new JSDOM('')).window;
  const DOMPurify = createDOMPurify(window);

  const rawHtml = String(req.body.html || '');
  const cleanHtml = DOMPurify.sanitize(rawHtml); // まずはデフォでOK
  const author = String(req.body.author || 'Host').slice(0,100);
  const isDraft = req.body.isDraft === 'on';

  await db.collection('articles').doc(id).set({
    html: cleanHtml,
    author,
    isDraft,
    updatedAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  res.redirect('/admin/articles/' + encodeURIComponent(id));
});


module.exports = router;
