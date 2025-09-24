const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(process.cwd(), 'data', 'reviews');
fs.mkdirSync(DATA_DIR, { recursive: true });

function readAllReviews(){
  const files = fs.readdirSync(DATA_DIR).filter(f=>f.endsWith('.json'));
  const list = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); } catch (e) { return null; }
  }).filter(Boolean);
  return list.sort((a,b)=> new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
}

// recent reviews
router.get('/recent', (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '3', 10)));
    const list = readAllReviews().slice(0, limit);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// single review by id
router.get('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const file = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(file)) return res.status(404).json({ ok:false, msg:'not found' });
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok:false, msg: err.message });
  }
});

module.exports = router;