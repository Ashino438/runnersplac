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
const fs = require('fs').promises;
const path = require('path');
// const DOMPurify = require('isomorphic-dompurify'); // 一時的にコメントアウト

// ここは自分の認証に合わせて。req.user?.isAdmin を想定
function requireAdmin(req, res, next){
    console.log('=== requireAdmin middleware ===');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    
    try {
      // 一時的に認証をスキップしてテスト
      console.log('Skipping admin auth for testing...');
      next();
    } catch (error) {
      console.error('requireAdmin error:', error);
      next(error);
    }
  }
  
// 編集フォーム
router.get('/admin/articles/:shoeId', requireAdmin, async (req, res) => {
  const id = String(req.params.shoeId);
  const snap = await db.collection('articles').doc(id).get();
  const doc = snap.exists ? snap.data() : { html:'', author:'', isDraft:true };
  res.render('admin-article-edit', { shoeId: id, doc });
});

// GET /admin/articles/:id - 記事編集ページを表示
router.get('/admin/articles/:id', requireAdmin, async (req, res) => {
  try {
    const shoeId = req.params.id;
    console.log('Loading article for editing:', shoeId);
    
    // 既存の記事を読み込み
    let doc = { html: '', author: '', isDraft: false };
    
    try {
      const jsonPath = path.join(__dirname, '..', 'data', 'articles', `${shoeId}.json`);
      const data = await fs.readFile(jsonPath, 'utf-8');
      doc = JSON.parse(data);
      console.log('Loaded existing article:', jsonPath);
    } catch (error) {
      console.log('No existing article found, using defaults');
    }
    
    res.render('admin-article-edit', { shoeId, doc });
  } catch (error) {
    console.error('Failed to load article editor:', error);
    res.status(500).send('記事編集ページの読み込みに失敗しました: ' + error.message);
  }
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
      const bucketName = (bucket && bucket.name) ? String(bucket.name) : '';
      const forceLocal = String(process.env.FORCE_LOCAL_UPLOADS || '').trim() === '1';
      const useCloud = !!bucketName && !forceLocal;

      let url = null;

      if (useCloud) {
        try {
          const dest = `articles/${req.params.shoeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const file = bucket.file(dest);
          await file.save(req.file.buffer, {
            contentType: mime,
            resumable: false,
            metadata: { cacheControl: 'public,max-age=31536000' },
          });
          const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
          url = signedUrl;
        } catch (cloudErr) {
          console.warn('Cloud upload failed, switching to local. Reason:', cloudErr?.message || cloudErr);
        }
      } else {
        console.log('Using local upload (bucket missing or FORCE_LOCAL_UPLOADS=1). bucketName:', bucketName);
      }

      if (!url) {
        const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'articles', String(req.params.shoeId));
        await fs.mkdir(uploadsDir, { recursive: true });
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const localPath = path.join(uploadsDir, fileName);
        await fs.writeFile(localPath, req.file.buffer);
        url = `/uploads/articles/${encodeURIComponent(String(req.params.shoeId))}/${encodeURIComponent(fileName)}`;
      }

      return res.json({ ok:true, url, storage: url.startsWith('http') ? 'cloud' : 'local' });
    } catch (e) {
      console.error('Upload handler error:', e);
      return res.status(500).json({ ok:false, msg:'upload failed', error: e?.message || String(e) });
    }
  }
);


// AJAX/JSONリクエスト判定ヘルパー
function wantsJSON(req) {
  const accept = req.headers.accept || '';
  const ctype = req.headers['content-type'] || '';
  const xrw = (req.headers['x-requested-with'] || '').toLowerCase();
  return ctype.includes('application/json') || accept.includes('application/json') || xrw === 'xmlhttprequest';
}

// 保存（新規でも自動作成される）
router.post('/admin/articles/:shoeId', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.shoeId);
    const window = (new JSDOM('')).window;
    const DOMPurify = createDOMPurify(window);

    const rawHtml = String(req.body.html || '');
    // 後方互換のためのエイリアス（旧コードでhtmlを参照しても落ちないように）
    const html = rawHtml;

    // サニタイズ
    const cleanHtml = basicSanitize(rawHtml);

    const author = String(req.body.author || 'Host').slice(0,100);
    const isDraft = req.body.isDraft === true || req.body.isDraft === 'on' || req.body.isDraft === 'true';

    // Firestoreへ保存
    await db.collection('articles').doc(id).set({
      html: cleanHtml,
      author,
      isDraft,
      updatedAt: admin.firestore.Timestamp.now()
    }, { merge: true });

    // JSONファイルとして保存（バックアップ用）
    const jsonDir = path.join(__dirname, '..', 'data', 'articles');
    await fs.mkdir(jsonDir, { recursive: true });
    const jsonPath = path.join(jsonDir, `${id}.json`);
    await fs.writeFile(jsonPath, JSON.stringify({
      html: cleanHtml,
      author,
      isDraft,
      updatedAt: new Date().toISOString()
    }, null, 2), 'utf8');

    // 静的HTMLファイルとして保存（表示用）
    const articlesDir = path.join(__dirname, '..', 'public', 'articles');
    await fs.mkdir(articlesDir, { recursive: true });
    const htmlPath = path.join(articlesDir, `${id}.html`);

    if (!isDraft) {
      await fs.writeFile(htmlPath, cleanHtml, 'utf8');
    } else {
      try { await fs.unlink(htmlPath); } catch (_) {}
    }

    // レスポンス分岐
    if (wantsJSON(req)) {
      return res.json({ success: true, message: '保存完了', id, paths: { json: jsonPath, html: htmlPath } });
    }
    return res.redirect('/admin/articles/' + encodeURIComponent(id));
  } catch (error) {
    console.error('admin save error:', error);
    if (wantsJSON(req)) {
      return res.status(500).json({ success: false, error: '保存に失敗しました', message: error.message });
    }
    return res.status(500).send('保存に失敗しました: ' + error.message);
  }
});

// POST /admin/articles/:id - 記事を保存
router.post('/admin/articles/:id', requireAdmin, async (req, res) => {
  console.log('=== POST route reached ===');
  console.log('req.params.id:', req.params.id);
  console.log('req.body:', req.body);
  console.log('req.headers:', req.headers);
  
  try {
    const shoeId = req.params.id;
    
    console.log('=== 記事保存開始 ===');
    console.log('shoeId:', shoeId);
    console.log('req.body exists:', !!req.body);
    
    // req.bodyが存在しない場合のエラー処理
    if (!req.body) {
      console.error('req.body is undefined or null');
      return res.status(400).json({ error: 'リクエストボディが空です。フォームが正しく送信されていません。' });
    }
    
    // リクエストボディからhtmlを取得
    const { html, author, isDraft } = req.body;
    
    console.log('Extracted values:');
    console.log('- html exists:', !!html);
    console.log('- html type:', typeof html);
    console.log('- html content:', html);
    console.log('- author:', author);
    console.log('- isDraft:', isDraft);
    
    if (!html) {
      console.log('HTML is missing or empty');
      return res.status(400).json({ error: 'htmlが必要です' });
    }

    // サニタイズ
    console.log('Starting sanitization...');
    const cleanHtml = basicSanitize(html);
    console.log('Sanitization completed');
    
    const doc = {
      html: cleanHtml,
      author: author || '',
      isDraft: isDraft === true || isDraft === 'on',
      updatedAt: new Date().toISOString()
    };
    
    console.log('Document object created:', doc);

    // JSONファイルとして保存（バックアップ用）
    const jsonDir = path.join(__dirname, '..', 'data', 'articles');
    console.log('JSONディレクトリ:', jsonDir);
    await fs.mkdir(jsonDir, { recursive: true });
    const jsonPath = path.join(jsonDir, `${shoeId}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(doc, null, 2));
    console.log('JSON保存完了:', jsonPath);

    // 静的HTMLファイルとして保存（表示用）
    const articlesDir = path.join(__dirname, '..', 'public', 'articles');
    console.log('HTMLディレクトリ:', articlesDir);
    await fs.mkdir(articlesDir, { recursive: true });
    const htmlPath = path.join(articlesDir, `${shoeId}.html`);
    console.log('HTMLパス:', htmlPath);
    
    // 下書きでない場合のみ静的HTMLを生成
    if (!doc.isDraft) {
      await fs.writeFile(htmlPath, cleanHtml, 'utf-8');
      console.log('HTML保存完了:', htmlPath);
    } else {
      // 下書きに変更した場合は既存のHTMLファイルを削除
      try {
        await fs.unlink(htmlPath);
        console.log('HTML削除完了:', htmlPath);
      } catch (e) {
        console.log('HTML削除スキップ（ファイル無し）:', htmlPath);
      }
    }

    console.log('=== 記事保存完了 ===');
    res.json({ success: true, message: '保存完了', paths: { json: jsonPath, html: htmlPath } });
    
  } catch (error) {
    console.error('記事保存エラー:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // JSONエラーレスポンスを確実に返す
    try {
      if (!res.headersSent) {
        res.status(500).json({ 
          error: '保存に失敗しました: ' + error.message,
          details: error.stack 
        });
      }
    } catch (responseError) {
      console.error('Error sending response:', responseError);
    }
  }
});

// 簡易サニタイズ関数（本格的なものではないが、テスト用）
function basicSanitize(htmlContent) {
  if (!htmlContent) return '';
  // 一時的にサニタイズを無効にして、ファイル保存テストを優先
  return htmlContent;
  
  // 後で有効にする場合のコード
  /*
  return htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  */
}

module.exports = router;
