// /public/js/tabbed-ui.js
(function () {
  const start = () => {
    // __SHOE__ 初期化
    if (!window.__SHOE__) {
      const root = document.getElementById('memo-root');
      window.__SHOE__ = {
        id: root?.dataset.shoeId || '',
        name:
          (root?.dataset.name ? JSON.parse(root.dataset.name) :
            (document.querySelector('.hero h1')?.textContent?.trim() || '')),
        chartData: (root?.dataset.chart ? JSON.parse(root.dataset.chart) : []),
      };
    }

    const hero = document.querySelector('.hero');
    if (!hero) return;
    const heroText = hero.querySelector('.hero-text');
    const heroImg  = hero.querySelector('.hero-img');
    if (!heroText) return;

    const shoeId = window.__SHOE__?.id;
    const labels10 = [
      'クッション','安定性','軽さ','コスパ','履き心地',
      'デザイン','通気性','スピード','グリップ','耐久性'
    ];

    // ===== helpers =====
    // ===== helpers =====
function normShoeHref(x){
  if (!x) return '';
  let s = String(x).trim();

  // フルURLならパスだけ取り出す
  const mFull = s.match(/^[a-z]+:\/\/[^/]+(\/[^?#]*)/i);
  if (mFull) s = mFull[1] || s;

  // /shoes/slug or shoes/slug or /shoe/slug → /shoes/slug に正規化
  const mPath = s.match(/^\/?shoe[s]?\/([^/?#]+)/i);
  if (mPath) {
    try { return `/shoes/${encodeURIComponent(decodeURIComponent(mPath[1]))}`; }
    catch { return `/shoes/${encodeURIComponent(mPath[1])}`; }
  }

  // 先頭が / で /shoes 以外は触らない
  if (s.startsWith('/')) return s;

  // ただのID or 相対 shoes/slug
  if (s.startsWith('shoes/')) s = s.replace(/^shoes\//,'');
  return `/shoes/${encodeURIComponent(s)}`;
}


    
    // 差し替え：競合セルをリンク化（shoes/{id} に揃える）
function renderCompCell(c){
  const esc = (s) => escapeHtml(String(s ?? ''));
  if (c && typeof c === 'object') {
    const text = c.text || c.label || '';
    // href/url が相対idなら shoes/{id} に．絶対URLや / 始まりはそのまま
    const raw = c.href || c.url || (c.id ? c.id : '');
    const href = normShoeHref(raw);
    return href ? `<a class="shoe-link" href="${escapeHtml(href)}">${esc(text)}</a>` : esc(text);
  }

  const s = String(c ?? '');
  // [[表示|ターゲット]] のターゲットが相対idなら shoes/{id} に
  const m = s.match(/^\[\[(.+?)\|(.+?)\]\]$/);
  if (m) {
    const text = m[1];
    const href = normShoeHref(m[2]);
    return `<a class="shoe-link" href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
  }

  // 名前→idマップがあればそれを shoes/{id} に
  const map = (window.__MEMO__?.competitors?.links) || {};
  if (map[s]) {
    const href = normShoeHref(map[s]);
    return `<a class="shoe-link" href="${escapeHtml(href)}">${esc(s)}</a>`;
  }

  // 不明なときは検索に飛ばす（ここはそのまま）
  return `<a class="shoe-link" href="/search?q=${encodeURIComponent(s)}">${esc(s)}</a>`;
}


    // chartData または MEMO からおすすめペース
    function inferPaceLine(arr){
      if (typeof window.__MEMO__?.pace === 'string' && window.__MEMO__.pace.trim()) {
        return window.__MEMO__.pace.trim();
      }
      if (!Array.isArray(arr) || arr.length < 8) return '—';
      const sp = Number(arr[7]||0); // スピード
      const lt = Number(arr[2]||0); // 軽さ
      const cs = Number(arr[0]||0); // クッション
      if (sp >= 4.5 && lt >= 4) return '3:30〜4:15 /km（インターバル〜5km）';
      if (sp >= 4 && lt >= 3.5)   return '4:00〜5:00 /km（テンポ〜10km）';
      if (cs >= 4)                return '5:00〜6:30 /km（ジョグ〜LSD）';
      return '4:30〜6:00 /km（ジョグ〜テンポ手前）';
    }

    // ===== style =====
    // ===== style =====
const style = document.createElement('style');
style.textContent = `
  :root{
    --bg:#0b1220;           /* ページ地の黒 */
    --card:#0f172a;         /* カードの濃紺 */
    --text:#e5e7eb;         /* 文字（明） */
    --muted:#9ca3af;        /* サブ文字 */
    --border:#1f2937;       /* 枠線 */
    --accent:#38bdf8;       /* 水色 */
    --accent-weak: rgba(56,189,248,.14);
    --accent-strong: rgba(56,189,248,1);
  }

  /* カード＆文字色をダークへ */
  #tab-wrap, #tab-wrap .card{ background:var(--card); color:var(--text); }
  #tab-wrap h2, #tab-wrap h3{ color:var(--text); font-weight:800; }
  #tab-wrap .muted, #tab-wrap .comment-head, #tab-wrap .fact-val{ color:var(--muted); }

  /* タブを黒ベースに */
  .tabs{
    display:flex; gap:0; padding:.25rem .25rem 0;
    border-bottom:1px solid var(--border); background:#0b1220; border-radius:12px 12px 0 0;
  }
  .tab-btn{
    padding:.8rem 1.2rem; border:none; background:transparent; cursor:pointer;
    color:var(--muted); font-size:1rem; font-weight:700; letter-spacing:.02em; transition:.2s;
  }
  .tab-btn:hover{ color:var(--text); background:rgba(255,255,255,.03); }
  .tab-btn.active{
    color:var(--accent-strong);
    border-bottom:2px solid var(--accent-strong);
    background:rgba(56,189,248,.06);
  }
  .tab-pane{display:none} .tab-pane.active{display:block}

  /* レイアウト */
  .overview-grid{display:grid;grid-template-columns:1fr;gap:2rem}
  @media(min-width:900px){.overview-grid{grid-template-columns:1.2fr .8fr}}
  .overview-media img{width:100%;height:auto;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.35)}

  /* ピル（指標タブ） */
  .pill-grid{display:flex;flex-wrap:wrap;gap:.6rem}
  .pill{
    padding:.45rem .9rem;border:1px solid var(--border);border-radius:999px;
    background:#0b1220;color:var(--muted);cursor:pointer;transition:.2s;font-size:.9rem
  }
  .pill:hover{ background:#0b1220; color:var(--text); border-color:#334155; }
  .pill.active{ background:var(--accent); color:#06202b; border-color:var(--accent); }

  /* 事実行 */
  .fact-row{display:flex;gap:.75rem;align-items:center;margin:.5rem 0}
  .fact-ico{
    background:var(--accent-weak); color:var(--accent-strong);
    border-radius:9999px; padding:.35rem .8rem; font-weight:800
  }
  .fact-label{font-weight:800;color:var(--text)}

  /* リンク色 */
  .shoe-link{color:var(--accent-strong); text-decoration:none; border-bottom:1px dotted rgba(56,189,248,.5)}
  .shoe-link:hover{opacity:.85}

  /* アコーディオン（バイオメカ） */
  .acc{margin-top:1rem;border:1px solid var(--border);border-radius:12px;overflow:hidden}
  .acc-h{
    width:100%;text-align:left;background:#0b1220;border:none;
    padding:1rem 1.25rem;cursor:pointer;font-weight:800;color:var(--text)
  }
  .acc-h:hover{background:#0c1623}
  .acc-p{display:none;padding:1rem 1.25rem;background:#0f172a;color:var(--muted);line-height:1.8}
  .acc-p.open{display:block}

  /* レーダー枠 */
  .chart-box{width:min(560px,100%);height:380px;margin:auto;position:relative}

  /* レビュー表示の星 */
  .star{font-size:1rem;line-height:1}
  .star.full,.star.half{color:var(--accent-strong)}
  .star.empty{color:#334155}
  .score .num{margin-left:.4rem;color:var(--muted)}

  /* バッジリンク（小さなリンク） */
  .tabs .badge-link{
    margin-left:.5rem;padding:.35rem .6rem;border:1px solid var(--border);
    border-radius:.5rem;font-size:.85rem;text-decoration:none;color:var(--muted)
  }

  /* “ユーザーの声”のカード（白インラインをやめる） */
  .section-card{
    background:#0b1220;border:1px solid var(--border);border-radius:12px;
    padding:1rem;margin:.6rem 0;box-shadow:0 1px 3px rgba(0,0,0,.25)
  }
  .uv-use{color:var(--accent-strong);font-weight:800;margin-bottom:.25rem}
  .uv-content{color:var(--text);font-size:.95rem}
`;
document.head.appendChild(style);

    document.head.appendChild(style);

    // ===== wrapper & tabs =====
    const wrap = document.createElement('div');
    wrap.id = 'tab-wrap';
    wrap.className = 'card';
    wrap.innerHTML = `
      <nav class="tabs" role="tablist">
        <button class="tab-btn active" data-target="tab-overview">概要</button>
        <button class="tab-btn" data-target="tab-competitors">競合</button>
        <button class="tab-btn" data-target="tab-analysis">分析</button>
        <button class="tab-btn" data-target="tab-community">コミュニティ</button>
        <button class="tab-btn" data-target="tab-host">レビュー本文</button>
      </nav>

      <section id="tab-overview" class="tab-pane active">
        <div class="overview-grid">
          <div class="overview-media" id="ov-media"></div>
          <div>
            <h2>モデル概要</h2>
            <p class="muted" id="model-sub"></p>
            <div id="memo-quickfacts"></div>
          </div>
        </div>
      </section>

      <section id="tab-competitors" class="tab-pane">
        <div class="card"><h2>競合比較</h2><div id="memo-competitors"></div></div>
      </section>

      <section id="tab-analysis" class="tab-pane">
        <div class="card">
          <h2>ホスト評価（レーダー）</h2>
          <div class="chart-box"><canvas id="chart" aria-label="性能レーダー"></canvas></div>
        </div>
        <div class="card">
          <h2>性能ごとの分析</h2>
          <div id="metric-pills" class="pill-grid"></div>
        </div>
        <div class="card" id="metric-panel" hidden>
          <h3 id="metric-title"></h3>
          <ul id="metric-comment-list" class="comment-list"></ul>
          <button id="metric-more" class="more-btn" hidden>もっと見る</button>
        </div>
      </section>

      <section id="tab-community" class="tab-pane">
        <div class="card">
          <h2>みんなの平均レーダー</h2>
        <div class="chart-box"><canvas id="avgChart" aria-label="平均レーダー"></canvas></div>
        </div>
        <div class="card">
          <h2>レビュー投稿</h2>
          <div id="community-form-slot"></div>
        </div>
        <div class="card">
          <h2>みんなのレビュー一覧</h2>
          <ul id="community-comment-list" class="comment-list"></ul>
          <button id="community-more" class="more-btn" hidden>もっと見る</button>
        </div>
        <div class="card" id="user-voice-slot"></div>
      </section>

      <section id="tab-host" class="tab-pane"></section>
    `;
    hero.insertAdjacentElement('afterend', wrap);

    // ===== Overview content =====
    document.getElementById('model-sub').textContent =
      document.querySelector('.sub')?.textContent || '';

    // ===== バイオメカ（JSONから読み込み・見出し→タップ展開） =====
   (function addBiomech(){
  const root = document.getElementById('memo-root');
  const sid  = (window.__SHOE__ && window.__SHOE__.id) || root?.dataset.shoeId || '';
  const esc  = (s) => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const mount = document.getElementById('tab-overview') || root || document.body;

  // 候補URL（上から順に試す）
  const prefer = sid ? `/memos/${encodeURIComponent(sid)}` : '';
  const candidates = [
    root?.dataset.biomechUrl || null,           // 明示指定があれば最優先
    prefer ? `${prefer}.json` : null,           // /memos/pegasus41.json
    prefer || null,                              // /memos/pegasus41
    sid ? `/memos/shoes/${encodeURIComponent(sid)}/biomechanics.json` : null, // 旧パス（スラ入り）
    '/api/biomechanics.json'                     // 最後の手段
  ].filter(Boolean);

  function render(sections){
    const card = document.createElement('div');
    card.className = 'card bio-card';
    card.innerHTML = `<h2>バイオメカニクス解説</h2>
      <div class="acc" id="bio-acc">
        ${sections.map((s,i)=>`
          <button class="acc-h" data-k="acc${i}">${esc(s.title || '解説')}</button>
          <div class="acc-p" id="acc${i}">${esc(s.body ?? s.content ?? '')}</div>
        `).join('')}
      </div>`;
    mount.querySelector('.bio-card')?.remove();
    mount.appendChild(card);

    card.addEventListener('click', e=>{
      const h = e.target.closest('.acc-h'); if(!h) return;
      const id = h.dataset.k;
      const p  = card.querySelector('#'+id);
      if (p) p.classList.toggle('open');
    });
  }

  async function fetchFirst(urls){
    for (const url of urls){
      try{
        const res = await fetch(url, { headers:{'Accept':'application/json'}, cache:'no-store' });
        if(!res.ok) continue;
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : await res.text().then(t=>JSON.parse(t));
        if (data) return data;
      }catch(_e){ /* 次の候補へ */ }
    }
    throw new Error('all sources failed');
  }

  const defaultFallback = [
    { title:'ランニングエコノミー', body:'データ未取得．ReactXやZoom Airの寄与は要検証．' },
    { title:'関節モーメント', body:'データ未取得．スタックとドロップにより負荷配分が変化する可能性．' }
  ];

  fetchFirst(candidates)
    .then(data=>{
      const arr = Array.isArray(data) ? data
        : Array.isArray(data?.biomechanics) ? data.biomechanics
        : Array.isArray(data?.sections) ? data.sections
        : [];
      const sections = arr.map(({ title, content, body }) => ({ title: title || '解説', body: content ?? body ?? '' }));
      render(sections.length ? sections : (window.__BIO_FALLBACK__ || defaultFallback));
    })
    .catch(err=>{
      console.warn('[biomech] fetch failed:', err);
      render(window.__BIO_FALLBACK__ || defaultFallback);
    });
})();

    // ===== move existing DOM =====
    if (heroImg) document.getElementById('ov-media')?.appendChild(heroImg);
    const hostArticle = document.querySelector('.host-article.card');
    if (hostArticle) document.getElementById('tab-host')?.appendChild(hostArticle);

    // コメントフォームをコミュニティタブへ
    const commentsSec = document.querySelector('.comments.card');
    if (commentsSec) {
      const form = commentsSec.querySelector('form#comment-form');
      if (form) document.getElementById('community-form-slot')?.appendChild(form);
      commentsSec.remove();
    }

    // JSONあり＝レガシーUIの重複を消す
    document.querySelector('.charts')?.remove();
    document.querySelector('.host-table.card')?.remove();

    // ===== MEMO rendering =====
    if (window.__MEMO__) {
      const esc = (s) => escapeHtml(String(s ?? ''));
      // Quick facts
      const qfWrap = document.getElementById('memo-quickfacts');
      qfWrap.innerHTML = (window.__MEMO__.quickFacts || []).map(f => `
        <div class="fact-row">
          <span class="fact-ico">${esc(f.icon || 'ℹ️')}</span>
          <span class="fact-label">${esc(f.label || '')}</span>
          <span class="fact-val">${esc(f.value || '')}</span>
        </div>`).join('');

      // Competitors
      // Competitors
const comp = window.__MEMO__?.competitors;
if (comp?.headers?.length && comp?.rows?.length) {
  const esc = (s) => escapeHtml(String(s ?? ''));
  const headers = comp.headers;

  // 列位置を検出（なければフォールバック）
  const nameIdx = headers.findIndex(h => /^(モデル|name|model)$/i.test(String(h)));
  const idIdx   = headers.findIndex(h => /^id$/i.test(String(h)));
  const nameCol = nameIdx >= 0 ? nameIdx : 0;

  const t = document.createElement('table');
  t.style.width='100%';
  t.style.borderCollapse='collapse';

  const thead = `<thead><tr>${
    headers.map(h=>`<th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:.5rem;color:#6B7280;font-size:.9rem">${esc(h)}</th>`).join('')
  }</tr></thead>`;

  const tbody = `<tbody>${
    comp.rows.map(r=>{
      const idVal = idIdx >= 0 ? r[idIdx] : null;
      return `<tr>${
        headers.map((_, idx)=>{
          let html;
          if (idx === nameCol) {
            // モデル名セルは id を使ってリンク化
            const cellVal = r[idx];
            const obj = (idVal ? { text: cellVal, id: idVal } : cellVal);
            html = renderCompCell(obj);
          } else {
            html = esc(r[idx]);
          }
          return `<td style="border-top:1px solid #f0f0f0;padding:.5rem">${html}</td>`;
        }).join('')
      }</tr>`;
    }).join('')
  }</tbody>`;

  t.innerHTML = thead + tbody;
  document.getElementById('memo-competitors')?.appendChild(t);
}


      // User voice
      const uv = window.__MEMO__.userVoice || [];
      if (uv.length) {
        const slot = document.getElementById('user-voice-slot');
        slot.innerHTML = `<h2>ユーザーの声</h2>` + uv.map(v => `
          <div class="section-card" style="background:#fff;border-radius:12px;padding:1rem;margin:.6rem 0;box-shadow:0 1px 3px rgba(0,0,0,.06);">
            <div class="text-amber-700" style="font-weight:700;margin-bottom:.25rem">${esc(v.use || '')}</div>
            <div style="color:#374151;font-size:.95rem">${esc(v.content || '')}</div>
          </div>`).join('');
      }
    }

    // ===== tabs logic =====
    const tabsNav = wrap.querySelector('.tabs');
    let analysisInited = false, communityInited = false;
    tabsNav.querySelectorAll('.tab-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id = btn.dataset.target;
        tabsNav.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b===btn));
        wrap.querySelectorAll('.tab-pane').forEach(p=>p.classList.toggle('active', p.id===id));
        if (id==='tab-analysis' && !analysisInited){ initAnalysis(); analysisInited=true; }
        if (id==='tab-community' && !communityInited){ initCommunity(); communityInited=true; }
      });
    });

    // ===== analysis tab =====
    function initAnalysis(){
      if (window.Chart){
        const ctx = document.getElementById('chart')?.getContext('2d');
        if (ctx){
          new Chart(ctx,{ type:'radar',
            data:{ labels:labels10,
              datasets:[{ label: window.__SHOE__?.name||'Host',
                data: window.__SHOE__?.chartData||[],
                backgroundColor:'rgba(234,88,12,.25)', borderColor:'rgba(180,83,9,1)',
                pointBackgroundColor:'rgba(180,83,9,1)', pointRadius:2, fill:true }]},
            options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
              scales:{ r:{ min:0,max:5,ticks:{ stepSize:1, backdropColor:'transparent' }}}}});
        }
      }

       const metrics = [
    ['cushion','クッション'], ['stability','安定性'],
    ['speed','スピード'], ['grip','グリップ'], ['durability','耐久性']
  ];
  const METRIC_MAP = { 'クッション':'cushion','安定性':'stability','スピード':'speed','グリップ':'grip','耐久性':'durability' };
  const normKey = (k) => k ? (METRIC_MAP[k] || String(k).toLowerCase()) : '';

  const pills = document.getElementById('metric-pills');
  pills.innerHTML = metrics.map(([k,l]) => `<button class="pill" data-metric="${k}">${l}</button>`).join('');

  const panel = document.getElementById('metric-panel');
  const title = document.getElementById('metric-title');
  const list  = document.getElementById('metric-comment-list');
  const more  = document.getElementById('metric-more');

  let cursor = null;
  let currentMetric = null;

  async function fetchMetricComments(metric, after) {
   const url = new URL(`/memos/${encodeURIComponent(shoeId)}.json`, location.origin);
    url.searchParams.set('metric', metric); // サーバ側で対応してるなら有効
    if (after) url.searchParams.set('cursor', after);
    const r = await fetch(url);
    if (!r.ok) throw new Error('fetch failed');
    const j = await r.json();
    if (j.items) return j;
    // フロント側フィルタ（日本語キーでも通るように正規化）
    const items = (j.comments || []).filter(c => !metric || normKey(c.metric) === metric);
    return { items, nextCursor: j.nextCursor || null };
  }

  async function renderMetric(metric, reset=true) {
    if (reset) { list.innerHTML = ''; cursor = null; }
    title.textContent = (metrics.find(m => m[0]===metric)?.[1] || metric) + 'のコメント';
    panel.hidden = false;

    const data = await fetchMetricComments(metric, cursor);

    if (!data.items.length && !cursor){
      list.innerHTML = `<li class="muted">まだコメントがありません．最初のレビューを書いてみて！</li>`;
      more.hidden = true;
      return;
    }

    data.items.forEach(it => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="comment-head">
          <span class="score">${it.score ?? '-'}</span>
          <time datetime="${it.createdAt||''}">${it.createdAt ? new Date(it.createdAt).toLocaleDateString() : ''}</time>
        </div>
        <p>${escapeHtml(it.text || it.comment || '')}</p>
      `;
      list.appendChild(li);
    });
    cursor = data.nextCursor || null;
    more.hidden = !cursor;
  }

  pills.addEventListener('click', e => {
    const btn = e.target.closest('button[data-metric]');
    if (!btn) return;
    currentMetric = btn.dataset.metric;
    pills.querySelectorAll('.pill').forEach(b => b.classList.toggle('active', b === btn));
    renderMetric(currentMetric, true).catch(console.error);
  });

  more.addEventListener('click', () => {
    if (!currentMetric) return;
    renderMetric(currentMetric, false).catch(console.error);
  });

  // ← 初期表示で最初のタブを自動で開く
  pills.querySelector('.pill')?.click();
}
    // ===== community tab =====
    function initCommunity(){
      const avgCtx = document.getElementById('avgChart')?.getContext('2d');
      let avgChartRef = null;

      async function refreshAvg(){
        const r = await fetch(`/api/comments/${encodeURIComponent(shoeId)}?limit=10`);
        if(!r.ok) return;
        const j = await r.json();
        const data = j?.avgRatings || [];
        const n = j?.count || 0;
        if (!data.some(v=>v>0)) return;
        if (!avgChartRef) {
          avgChartRef = new Chart(avgCtx,{ type:'radar',
            data:{ labels:labels10, datasets:[{ label:`みんなの平均（n=${n}）`, data,
              backgroundColor:'rgba(59,130,246,.22)', borderColor:'rgba(37,99,235,1)',
              pointBackgroundColor:'rgba(37,99,235,1)', pointRadius:2, fill:true }]},
            options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
                        scales:{ r:{ min:0,max:5,ticks:{ stepSize:1, backdropColor:'transparent' }}}}});
        } else {
          avgChartRef.data.datasets[0].data = data;
          avgChartRef.data.datasets[0].label = `みんなの平均（n=${n}）`;
          avgChartRef.update();
        }
      }
      if (avgCtx) refreshAvg().catch(()=>{});

      const listEl = document.getElementById('community-comment-list');
      const moreBtn = document.getElementById('community-more');
      let nextCursor = null;

      function starHtml(score){
        const s = Math.max(0, Math.min(5, Number(score)||0));
        let html='';
        for(let i=1;i<=5;i++){
          if (s >= i) html += '<span class="star full">★</span>';
          else if (s >= i-0.5) html += '<span class="star half">★</span>';
          else html += '<span class="star empty">☆</span>';
        }
        return `${html}<span class="num">${s.toFixed(1)}</span>`;
      }

      function renderList(items, append=false){
        if (!append) listEl.innerHTML = '';
        items.forEach(d=>{
          const li = document.createElement('li');
          const when = d.createdAt ? new Date(d.createdAt).toLocaleString() : '';
          const nick = escapeHtml(d.nickname || '匿名');
          const ratings = Array.isArray(d.ratings) ? d.ratings.filter(v=>v>0) : [];
          const mean = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length) : 0;
          li.innerHTML = `
            <article class="review">
              <header class="comment-head">
                <strong>${nick}</strong>
                <span class="score">${starHtml(mean)}</span>
                <time datetime="${d.createdAt||''}">${when}</time>
              </header>
              <p class="body">${escapeHtml(d.comment || '')}</p>
            </article>`;
          listEl.appendChild(li);
        });
      }

      async function fetchComments(append=false){
        const url = new URL(`/api/comments/${encodeURIComponent(shoeId)}`, location.origin);
        url.searchParams.set('limit','10');
        if (nextCursor) url.searchParams.set('cursor', nextCursor);
        const r = await fetch(url);
        if(!r.ok) return;
        const j = await r.json();
        renderList(j.comments || [], append);
        nextCursor = j.nextCursor || null;
        moreBtn.hidden = !nextCursor;
      }

      moreBtn?.addEventListener('click', ()=>fetchComments(true).catch(console.error));
      fetchComments(false).catch(console.error);

      const form = document.getElementById('comment-form');
      if (form && !form._bound) {
        form.addEventListener('submit', async (e)=>{
          e.preventDefault();
          const ratings=[]; for(let i=0;i<10;i++){
            const v = Number((document.querySelector(`input[name="rating-${i}"]:checked`)||{}).value||0);
            ratings.push(v);
          }
          if (ratings.some(v=>v<1||v>5)) return alert('各項目の★を1〜5で選んでから投稿してね！');
          const nickname = document.getElementById('nickname')?.value?.trim()||'';
          const comment  = document.getElementById('userComment')?.value?.trim()||'';
          const res = await fetch('/api/comments',{ method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ shoeId, comment, ratings, nickname })});
          if(!res.ok){
            const j=await res.json().catch(()=>({}));
            return alert('投稿失敗：'+(j.error||'サーバエラー'));
          }
          e.target.reset();
          nextCursor = null;
          await refreshAvg();
          await fetchComments(false);
          alert('投稿ありがとう！');
        });
        form._bound = true;
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
