require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs').promises;
const DOMPurify = require('dompurify');

const app = express();

// ----- 基本ミドルウェア（順序大事） -----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// セッション → ユーザー展開（これを先に）
const { sessionMiddleware, exposeUser } = require('./lib/session');
sessionMiddleware(app);
app.use(exposeUser);

app.use((req, _res, next)=>{
  console.log('[DBG] cookies=', req.headers.cookie || '(none)');
  next();
});


// res.locals の共通セット（これも早めに）
app.use((req, res, next) => {
  res.locals.req = req;
  res.locals.currentUrl = req.originalUrl;
  next();
});

// 静的ファイル
app.use(express.static(path.join(__dirname, 'public')));
app.use('/firebase', express.static(path.join(__dirname, 'firebase')));

// 静的ファイル配信（記事HTML用）
app.use('/articles', express.static(path.join(__dirname, 'public', 'articles')));

// テンプレ
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----- ルート（依存順に） -----
const formRouter = require('./routes/form');
const vomero18Router = require('./routes/form_vomero18');
const resultRouter = require('./routes/result');
const resultvomero18Router = require('./routes/result_vomero18');
const reviewRouter = require('./routes/review');

app.use('/form', formRouter);
app.use('/form_vomero18', vomero18Router);
app.use('/result', resultRouter);
app.use('/result_vomero18', resultvomero18Router);
app.use('/review', reviewRouter);

// シューズ詳細は catch-all より前に
app.use('/shoes', require('./routes/shoes'));

// API（※ 重複マウントを削除して1回だけ）
app.use('/api/comments', require('./routes/api/comments'));
app.use('/', require('./routes/wishlist'));

// 認証や管理画面（セッション後に）
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/admin.articles'));

app.get('/__set_test_cookie', (req, res) => {
  res.cookie('__session_test', 'hello', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // ローカルHTTPなら secure を付けない
    secure: false,
    maxAge: 600000,
  });
  res.send('ok');
});

// 404より前に置く
console.log('[BOOT] cwd=', process.cwd());
console.log('[BOOT] auth resolve=', require.resolve('./routes/auth')); // ここで例外出たらパス違い

const authRouter = require('./routes/auth');
console.log('[BOOT] authRouter type=', typeof authRouter); // "function" じゃなければexport崩れ

app.use('/', authRouter);


// ホーム/一覧（最後のほうでOK）
app.get('/', (req, res) => {
  const i = req.originalUrl.indexOf('?');
  const qs = i >= 0 ? req.originalUrl.slice(i) : '';
  res.redirect(302, '/home2' + qs);
});
app.get('/home', (req, res) => {
  const i = req.originalUrl.indexOf('?');
  const qs = i >= 0 ? req.originalUrl.slice(i) : '';
  res.redirect(301, '/home2' + qs);
});
app.use('/', require('./routes/home2'));
app.use('/', require('./routes/profile'));

// ブログページのルート
app.get('/blog/oldspice', (req, res) => {
  res.render('blog/oldspice');
});

// ヘルス
app.get('/__health', (_req,res)=>res.json({ok:true}));


// POST /admin/articles/:id - 記事を保存
app.post('/admin/articles/:id', async (req, res) => {
  try {
    const shoeId = req.params.id;
    const { html, author, isDraft } = req.body;
    
    console.log('=== 記事保存開始 ===');
    console.log('shoeId:', shoeId);
    console.log('isDraft:', isDraft);
    console.log('html length:', html ? html.length : 0);
    
    if (!html) {
      return res.status(400).json({ error: 'htmlが必要です' });
    }

    // サニタイズ
    const cleanHtml = html; // 一時的にサニタイズを無効化
    
    const doc = {
      html: cleanHtml,
      author: author || '',
      isDraft: isDraft === 'on',
      updatedAt: new Date().toISOString()
    };

    // JSONファイルとして保存（バックアップ用）
    const jsonDir = path.join(__dirname, 'data', 'articles');
    console.log('JSONディレクトリ:', jsonDir);
    await fs.mkdir(jsonDir, { recursive: true });
    const jsonPath = path.join(jsonDir, `${shoeId}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(doc, null, 2));
    console.log('JSON保存完了:', jsonPath);

    // 静的HTMLファイルとして保存（表示用）
    const articlesDir = path.join(__dirname, 'public', 'articles');
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
    res.status(500).json({ error: '保存に失敗しました: ' + error.message });
  }
});

// テスト用：記事ファイルの存在確認
app.get('/admin/articles/:id/check', async (req, res) => {
  try {
    const shoeId = req.params.id;
    const articlesDir = path.join(__dirname, 'public', 'articles');
    const htmlPath = path.join(articlesDir, `${shoeId}.html`);
    const jsonDir = path.join(__dirname, 'data', 'articles');
    const jsonPath = path.join(jsonDir, `${shoeId}.json`);
    
    const result = {
      articlesDir,
      htmlPath,
      jsonPath,
      htmlExists: false,
      jsonExists: false,
      htmlContent: null,
      jsonContent: null
    };
    
    try {
      await fs.access(htmlPath);
      result.htmlExists = true;
      result.htmlContent = await fs.readFile(htmlPath, 'utf-8');
    } catch (e) {
      result.htmlError = e.message;
    }
    
    try {
      await fs.access(jsonPath);
      result.jsonExists = true;
      result.jsonContent = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
    } catch (e) {
      result.jsonError = e.message;
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 簡単な接続テスト
app.get('/test', (req, res) => {
  res.json({ 
    message: 'サーバーは動いています', 
    time: new Date().toISOString(),
    __dirname: __dirname 
  });
});

// POST テスト
app.post('/test-post', (req, res) => {
  console.log('POST test received:', req.body);
  res.json({ received: req.body, time: new Date().toISOString() });
});

// GET /admin/articles/:id - 記事編集ページを表示
app.get('/admin/articles/:id', async (req, res) => {
  try {
    const shoeId = req.params.id;
    console.log('Loading article for editing:', shoeId);
    
    // 既存の記事を読み込み
    let doc = { html: '', author: '', isDraft: false };
    
    try {
      const jsonPath = path.join(__dirname, 'data', 'articles', `${shoeId}.json`);
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

// グローバルエラーハンドラ
app.use((error, req, res, next) => {
  console.error('=== Global Error Handler ===');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);
  
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Server error: ' + error.message,
      stack: error.stack
    });
  }
});

// 404エラーハンドラ
app.use((req, res) => {
  console.log('404 - Not Found:', req.url);
  res.status(404).json({ error: 'Not Found' });
});

// 500（原因をそのまま表示）
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.stack || err);
  if (req.path.startsWith('/api/')) {
    res.status(500).json({ error: err.message || 'internal' });
  } else {
    res
      .status(500)
      .send('Server error: ' + (err.message || 'internal'));
  }
});






const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} でサーバーが起動しました`);
});
