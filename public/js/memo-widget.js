// === memo-widget.js ===
// Drop-in widget to mix an interactive "Research Memo" UI into your existing EJS shoe detail page.
// No Tailwind required. Uses your existing Chart.js (already loaded on the page).
// 1) In detail.ejs, place: <section id="memo-root" class="card" data-shoe-id="<%= shoe.id %>"></section>
// 2) Serve memo JSON files under /memos/<shoeId>.json (static) OR inject a server variable window.__MEMO__.
// 3) Include this script after Chart.js: <script src="/js/memo-widget.js" defer></script>

(function(){
  const css = `
    #memo-root{margin-top:1.25rem}
    .memo-head{display:flex;justify-content:space-between;align-items:end;gap:.75rem;margin-bottom:.75rem}
    .memo-title{font-size:1.35rem;font-weight:700}
    .memo-updated{color:#6b7280;font-size:.9rem}
    .memo-tabs{display:flex;gap:.5rem;border-bottom:1px solid #e5e7eb;margin-bottom:.75rem;flex-wrap:wrap}
    .memo-tab{padding:.6rem .8rem;border-bottom:2px solid transparent;color:#6b7280;cursor:pointer;border-radius:.25rem .25rem 0 0}
    .memo-tab.active{color:#b45309;border-color:#b45309;font-weight:700;background:#fff7ed}
    .memo-section{display:none}
    .memo-section.active{display:block}
    .memo-card{background:#fff;border:1px solid #eee;border-radius:.75rem;box-shadow:0 2px 6px rgba(0,0,0,.05);padding:1rem}
    .memo-grid{display:grid;gap:1rem}
    @media(min-width:900px){.memo-grid{grid-template-columns:1fr 1fr}}
    .memo-fact{display:flex;align-items:center;gap:.6rem}
    .memo-icon{width:2.2rem;height:2.2rem;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#fef3c7;color:#b45309;font-weight:700}
    .memo-label{font-weight:700;color:#374151}
    .memo-muted{color:#6b7280}
    .memo-accordion h4{cursor:pointer;display:flex;justify-content:space-between;align-items:center;color:#92400e}
    .memo-acc-body{max-height:0;overflow:hidden;transition:max-height .25s ease}
    .memo-acc-body.open{max-height:500px}
    .memo-table{width:100%;border-collapse:collapse}
    .memo-table th,.memo-table td{border-top:1px solid #e5e7eb;padding:.6rem;text-align:left}
    .memo-table thead th{font-size:.85rem;letter-spacing:.02em;color:#6b7280}
    .memo-badge{font-size:.75rem;padding:.15rem .45rem;border-radius:.5rem;font-weight:700}
    .memo-badge.A{background:#dcfce7;color:#166534}
    .memo-badge.B{background:#fef9c3;color:#854d0e}
    .memo-badge.C{background:#fee2e2;color:#991b1b}
    .memo-note{background:#fff7ed;border:1px solid #fde68a;border-radius:.6rem;padding:.8rem;color:#7c2d12}
    .memo-danger{background:#fef2f2;border:1px solid #fecaca;color:#7f1d1d;border-radius:.6rem;padding:.8rem}
    canvas.memo-chart{width:100%;max-width:520px;height:320px}
  `;
  const style = document.createElement('style');
  style.textContent = css; document.head.appendChild(style);

  function h(tag, attrs={}, children=[]) {
    const el = document.createElement(tag);
    Object.entries(attrs||{}).forEach(([k,v])=>{
      if(k==='class') el.className=v; else if(k==='html') el.innerHTML=v; else el.setAttribute(k,v);
    });
    (Array.isArray(children)?children:[children]).filter(Boolean).forEach(c=>{
      if(typeof c==='string') el.appendChild(document.createTextNode(c)); else el.appendChild(c);
    });
    return el;
  }

  function mountTabs(root, tabs){
    const nav = h('div',{class:'memo-tabs'});
    const sections = tabs.map(t=>{
      const btn = h('button',{class:'memo-tab', 'data-k':t.key}, t.label);
      nav.appendChild(btn);
      const sec = h('section',{class:'memo-section', 'data-k':t.key});
      sec.appendChild(t.content);
      return {btn, sec};
    });
    root.appendChild(nav);
    sections.forEach(s=>root.appendChild(s.sec));
    function activate(key){
      sections.forEach(({btn,sec})=>{
        const on = btn.getAttribute('data-k')===key;
        btn.classList.toggle('active', on);
        sec.classList.toggle('active', on);
      });
    }
    nav.addEventListener('click',e=>{
      const b = e.target.closest('.memo-tab'); if(!b) return;
      activate(b.getAttribute('data-k'));
    });
    activate(tabs[0]?.key);
  }

  function renderMemo(root, memo){
    root.innerHTML='';
    const head = h('div',{class:'memo-head'},[
      h('div',{class:'memo-title'}, memo.title || 'リサーチメモ'),
      h('div',{class:'memo-updated'}, memo.updatedAt ? `更新日: ${memo.updatedAt}` : '')
    ]);
    root.appendChild(head);

    const overview = h('div',{class:'memo-grid'},[
      // Quick Facts
      h('div',{class:'memo-card'},[
        h('h3',{'class':'memo-label',},'Quick Facts'),
        h('div',{}, (memo.quickFacts||[]).map(f=>
          h('div',{class:'memo-fact'},[
            h('div',{class:'memo-icon'}, f.icon||'ℹ️'),
            h('div',{},[
              h('div',{class:'memo-label'}, f.label||''),
              h('div',{class:'memo-muted'}, f.value||'')
            ])
          ])
        ))
      ]),
      // Biomechanics
      h('div',{class:'memo-card memo-accordion'},[
        h('h3',{'class':'memo-label'},'Biomechanics Map'),
        ...(memo.biomechanics||[]).map(item=>{
          const head = h('h4',{},[
            h('span',{},item.title||''), h('span',{},'▼')
          ]);
          const body = h('div',{class:'memo-acc-body'}, h('p',{'class':'memo-muted',}, item.content||''));
          head.addEventListener('click',()=> body.classList.toggle('open'));
          return h('div',{},[head, body]);
        })
      ])
    ]);

    // Analysis
    const analysisWrap = h('div',{class:'memo-grid'},[
      h('div',{class:'memo-card'},[
        h('h3',{'class':'memo-label',},'Review Synthesis'),
        (function(){
          const c = h('canvas',{'class':'memo-chart',id:'memoRadar'});
          setTimeout(()=>{
            if(!window.Chart || !memo.reviewAnalysis) return;
            const ctx = c.getContext('2d');
            new Chart(ctx, {
              type: 'radar',
              data: {
                labels: memo.reviewAnalysis.labels || [],
                datasets: [{
                  label: memo.title || 'Review',
                  data: memo.reviewAnalysis.scores || [],
                  backgroundColor: 'rgba(244, 114, 23, .18)',
                  borderColor: 'rgba(234, 88, 12, 1)',
                  pointBackgroundColor: 'rgba(234, 88, 12, 1)'
                }]
              },
              options: {
                maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{r:{suggestedMin:0,suggestedMax:5,ticks:{stepSize:1,backdropColor:'transparent'}}}
              }
            });
          }, 0);
          return c;
        })()
      ]),
      h('div',{class:'memo-card'},[
        (function(){
          const box = h('div');
          const row = h('div',{style:'display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.5rem'});
          (memo.reviewAnalysis?.labels||[]).forEach(lbl=>{
            const b = h('button',{class:'memo-tab',style:'border:1px solid #e5e7eb;border-bottom-width:1px;border-radius:.5rem;'}, lbl);
            b.addEventListener('click',()=>{
              [...row.children].forEach(x=>x.classList.remove('active'));
              b.classList.add('active');
              const d = memo.reviewAnalysis?.details?.[lbl];
              box.innerHTML = `<h4 style="font-weight:700;margin:.2rem 0 .4rem">${lbl}</h4>` +
                (d? `<p><strong style="color:#047857">合意点:</strong> ${d.agreement||''}</p><p style="margin-top:.4rem"><strong style="color:#b91c1c">相違点/注意点:</strong> ${d.disagreement||''}</p>` : '<p class="memo-muted">データなし</p>');
            });
            row.appendChild(b);
          });
          const wrap = h('div');
          wrap.appendChild(row); wrap.appendChild(box);
          setTimeout(()=> row.querySelector('button')?.click(),0);
          return wrap;
        })()
      ])
    ]);

    // Competitors
    const comp = h('div',{class:'memo-card'},[
      h('h3',{'class':'memo-label'},'競合比較'),
      (function(){
        const table = h('table',{class:'memo-table'});
        const thead = h('thead');
        const tbody = h('tbody');
        const headers = memo.competitors?.headers || [];
        const rows = memo.competitors?.rows || [];
        thead.appendChild(h('tr',{}, headers.map(hd=>h('th',{},hd))));
        rows.forEach((r,i)=>{
          const tr = h('tr',{class: i===0?'':' '});
          r.forEach(cell=> tr.appendChild(h('td',{}, cell)));
          tbody.appendChild(tr);
        });
        table.appendChild(thead); table.appendChild(tbody);
        const sc = h('div',{style:'overflow:auto'}, table);
        return sc;
      })()
    ]);

    // Community
    const community = h('div',{class:'memo-grid'},[
      h('div',{class:'memo-card'},[
        h('h3',{'class':'memo-label'},'コミュニティの声'),
        h('div',{}, (memo.userVoice||[]).map(v=> h('div',{class:'memo-note',style:'margin:.5rem 0'},[
          h('div',{style:'font-weight:700;color:#92400e'}, v.use||''),
          h('div',{}, v.content||'')
        ])))
      ]),
      h('div',{class:'memo-card'},[
        h('h3',{'class':'memo-label'},'Risks & Unknowns'),
        h('div',{class:'memo-danger'}, h('ul',{}, (memo.risks?.points||[]).map(p=> h('li',{style:'margin:.4rem 0'}, p))))
      ])
    ]);

    // Sources
    const sources = h('div',{class:'memo-card'},[
      h('h3',{'class':'memo-label'},'Source List'),
      h('div',{}, (memo.sources||[]).map(s=> h('div',{style:'display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding:.5rem 0'},[
        h('div',{}, `${s.name||''} – ${s.type||''}`),
        h('span',{class:`memo-badge ${s.credibility||'A'}`}, s.credibility||'A')
      ])))
    ]);

    const tabs = [
      { key:'overview', label:'概要', content: overview },
      { key:'analysis', label:'レビュー分析', content: analysisWrap },
      { key:'competitors', label:'競合比較', content: comp },
      { key:'community', label:'コミュニティ', content: h('div',{},[community, sources]) }
    ];

    mountTabs(root, tabs);
  }

  async function loadMemo(shoeId){
    if (window.__MEMO__ && (window.__MEMO__.id===shoeId || !window.__MEMO__.id)) return window.__MEMO__;
    try{
      const res = await fetch(`/memos/${encodeURIComponent(shoeId)}.json`, {cache:'no-store'});
      if(!res.ok) return null;
      return await res.json();
    }catch(_){return null}
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const root = document.getElementById('memo-root');
    if(!root) return;
    const shoeId = root.dataset.shoeId;
    const memo = await loadMemo(shoeId);
    if(!memo){
      // Soft fallback: hide widget if no memo yet
      root.style.display='none';
      return;
    }
    renderMemo(root, memo);
  });

})();

// === Example memo JSON (save as /public/memos/pegasus41.json) ===
// {
//   "id": "pegasus41",
//   "title": "Nike Air Pegasus 41 — Interactive Research Memo",
//   "updatedAt": "2025-09-04",
//   "quickFacts": [
//     {"icon":"⚖️","label":"重量","value":"約289g (US9)"},
//     {"icon":"📐","label":"ドロップ","value":"10mm"},
//     {"icon":"📏","label":"スタック高","value":"約39.5/29.5mm（不確か）"},
//     {"icon":"🛠️","label":"ミッドソール","value":"ReactX + Air Zoom"},
//     {"icon":"🚫","label":"プレート","value":"なし"},
//     {"icon":"💰","label":"価格","value":"$140 / ¥17,050"}
//   ],
//   "biomechanics": [
//     {"title":"ランニングエコノミー","content":"ReactXは従来比13%高反発（Nike主張）。独立検証は要確認。"},
//     {"title":"関節モーメント","content":"約40mm厚と10mmドロップは足関節負荷→前方へ移行の可能性。"}
//   ],
//   "reviewAnalysis": {
//     "labels":["クッション","安定性","反発","重量感","フィット","耐久性"],
//     "scores":[4.2,4.0,3.5,3.0,4.5,4.8],
//     "details":{
//       "クッション":{"agreement":"前作よりソフト化。","disagreement":"豪華系ほどではない。"}
//     }
//   },
//   "competitors": {
//     "headers":["モデル","ミッドソール","重量","ドロップ","走行感","価格"],
//     "rows":[
//       ["Nike Pegasus 41","ReactX + Zoom Air","約289g","10mm","万能型","$140"],
//       ["Hoka Clifton 9","CMEVA","約248g","5mm","ソフト&ロッカー","$145"]
//     ]
//   },
//   "userVoice":[{"use":"ジョグ/ロング","content":"疲れていても安心して走れるという声が多い。"}],
//   "risks":{"points":["サイズ感の微差","ReactXの長期耐久性は不確か"]},
//   "sources":[{"name":"Nike Official","credibility":"A","type":"一次情報"}]
// }
