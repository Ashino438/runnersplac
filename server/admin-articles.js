const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

// Ensure base directories exist
const PUBLIC_UPLOADS = path.join(process.cwd(), 'public', 'uploads', 'articles');
const DATA_DIR = path.join(process.cwd(), 'data', 'articles');
const PUBLIC_ARTICLES = path.join(process.cwd(), 'public', 'articles');
fs.mkdirSync(PUBLIC_UPLOADS, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_ARTICLES, { recursive: true });

// --- added: GET route to load article from local JSON and render editor ---
router.get('/:id', (req, res) => {
  try {
    const id = String(req.params.id || 'untitled');
    const filePath = path.join(DATA_DIR, `${id}.json`);
    let doc = {};
    if (fs.existsSync(filePath)) {
      try { doc = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) { console.error('read doc failed', e); }
    }
    // render admin editor view; adjust view name/path if different in app
    return res.render('admin-article-edit', { shoeId: id, doc });
  } catch (err) {
    console.error(err);
    return res.status(500).send('読み込みに失敗しました');
  }
});
// --- end added route ---

// Multer storage that writes into public/uploads/articles/:id
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    try {
      const id = String(req.params.id || 'default');
      const dest = path.join(PUBLIC_UPLOADS, id);
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    } catch (err) {
      cb(err);
    }
  },
  filename: function(req, file, cb) {
    const name = Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname || '.jpg');
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// POST image upload -> returns { ok:true, url }
router.post('/:id/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok:false, msg:'no file' });
    const id = String(req.params.id || 'default');
    const filename = path.basename(req.file.filename);
    const url = path.posix.join('/uploads/articles', id, filename);
    res.json({ ok:true, url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok:false, msg: err.message });
  }
});

// POST article save -> saves JSON to data/articles/:id.json and redirects back
router.post('/:id', express.urlencoded({ extended: true }), (req, res) => {
  try {
    const id = String(req.params.id || 'untitled');
    const author = req.body.author || '';
    const html = req.body.html || '';
    const isDraft = !!req.body.isDraft;
    const now = new Date().toISOString();

    const payload = {
      id,
      author,
      isDraft,
      html,
      updatedAt: now
    };

    const filePath = path.join(DATA_DIR, `${id}.json`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');

    // attempt to also render a static HTML file for SEO
    (async function renderStatic(){
      try{
        if (isDraft) return; // don't publish drafts
        // basic sanitization: remove script tags
        const safeHtml = String(html).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
        const viewPath = path.join(process.cwd(), 'views', 'blog', 'show.ejs');
        const renderData = { blog: { title: id, author, updatedAt: now, html: safeHtml } };
        const options = { root: path.join(process.cwd(), 'views') };
        ejs.renderFile(viewPath, renderData, options, (err, str) => {
          if (err) return console.error('ejs render failed', err);
          const outPath = path.join(PUBLIC_ARTICLES, `${id}.html`);
          fs.writeFileSync(outPath, str, 'utf8');
          console.log('wrote static article to', outPath);
        });
      }catch(e){ console.error('renderStatic failed', e); }
    })();

    // If request expects JSON (AJAX), return JSON, else redirect back to editor
    if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
      return res.json({ ok:true, path: `/data/articles/${id}.json`, htmlPath: `/articles/${id}.html` });
    }
    res.redirect(`/admin/articles/${encodeURIComponent(id)}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('保存に失敗しました');
  }
});

module.exports = router;
