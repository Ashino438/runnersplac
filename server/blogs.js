const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(process.cwd(), 'data', 'articles');
fs.mkdirSync(DATA_DIR, { recursive: true });

// List blogs (non-draft)
router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const list = files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); } catch (e) { return null; }
    }).filter(Boolean).filter(i => !i.isDraft).sort((a,b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    return res.render('blog/index', { blogs: list, user: req.user || null });
  } catch (err) {
    console.error(err);
    return res.status(500).send('記事の読み込みに失敗しました');
  }
});

// Show single blog
router.get('/:slug', (req, res) => {
  try {
    const slug = req.params.slug;
    const filePath = path.join(DATA_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).send('記事が見つかりません');
    const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (doc.isDraft) return res.status(403).send('この記事は非公開です');
    return res.render('blog/show', { blog: doc, user: req.user || null });
  } catch (err) {
    console.error(err);
    return res.status(500).send('記事の読み込みに失敗しました');
  }
});

module.exports = router;