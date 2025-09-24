(function(){
  if (window._REVIEWS_LOADED) return; window._REVIEWS_LOADED = true;
  const container = document.querySelector('.community-section .reviews-list');
  if (!container) return;
  // if server already rendered items, skip
  if (container.querySelectorAll('.review-card').length > 0) return;

  fetch('/api/reviews/recent?limit=3').then(r=> r.json()).then(list=>{
    if (!Array.isArray(list) || list.length === 0) return;
    container.innerHTML = '';
    list.slice(0,3).forEach(r => {
      const a = document.createElement('article'); a.className = 'review-card';
      a.innerHTML = `
        <div class="rc-head">
          <a class="rc-shoe" href="/shoes/${encodeURIComponent(r.shoeSlug||'')}"><strong>${escapeHTML(r.shoeName||'シューズ')}</strong></a>
          <span class="muted">by ${escapeHTML(r.nickname||'匿名')}</span>
        </div>
        <p class="rc-body">${escapeHTML((r.comment && r.comment.length>140) ? r.comment.substring(0,140)+'…' : (r.comment||''))}</p>
        <div class="rc-meta">
          <span class="rating">評価: ${calcRating(r.ratings)}</span>
          <time datetime="${r.createdAt||''}">${r.createdAt? new Date(r.createdAt).toLocaleDateString():''}</time>
        </div>
      `;
      container.appendChild(a);
    });
  }).catch(e=> console.warn('reviews fetch failed', e));

  function calcRating(arr){ if (!Array.isArray(arr)) return '—'; const sum = arr.reduce((a,b)=>a+(b||0),0); const cnt = arr.filter(Boolean).length || arr.length || 1; return Math.round((sum/cnt)*10)/10; }
  function escapeHTML(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])); }
})();