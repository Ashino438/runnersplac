(function(){
  if (window._BLOGS_LOADED) return; window._BLOGS_LOADED = true;
  const grid = document.querySelector('.blog-section .blog-grid');
  if (!grid) return;
  // if server already rendered items, skip
  if (grid.querySelectorAll('.blog-card').length > 0) return;

  fetch('/api/blogs/index.json').then(r=> r.json()).then(list=>{
    if (!Array.isArray(list) || list.length === 0) return;
    grid.innerHTML = '';
    list.forEach(b => {
      const art = document.createElement('article'); art.className = 'blog-card';
      art.innerHTML = `
        <a href="/blog/${encodeURIComponent(b.slug)}" class="blog-thumb-link">
          <img class="blog-thumb" src="${escapeHTML(b.image||'/img/blog-placeholder.jpg')}" alt="${escapeHTML(b.title||'')}" loading="lazy" decoding="async">
        </a>
        <div class="blog-content">
          <h3><a href="/blog/${encodeURIComponent(b.slug)}">${escapeHTML(b.title||'')}</a></h3>
          <p class="excerpt">${escapeHTML(b.excerpt||'')}</p>
        </div>
      `;
      grid.appendChild(art);
    });
  }).catch(e=> console.warn('blogs fetch failed', e));

  function escapeHTML(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])); }
})();
