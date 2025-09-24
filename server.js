const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// 記事保存エンドポイント
app.post('/api/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        
        const articlePath = path.join(__dirname, 'public', 'articles', `${id}.html`);
        
        // HTMLテンプレート生成
        const htmlContent = `<h2>${title}</h2>
<p>${content}</p>
<p>現在の時刻: <script>document.write(new Date().toLocaleString())</script></p>`;
        
        await fs.writeFile(articlePath, htmlContent, 'utf8');
        
        res.json({ success: true, message: '記事が保存されました' });
    } catch (error) {
        console.error('記事保存エラー:', error);
        res.status(500).json({ success: false, message: '保存に失敗しました' });
    }
});

// ...existing code...