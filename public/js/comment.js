import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { app } from "/firebase/config.js"; // 初期化済みのFirebaseアプリ
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
const auth = getAuth(app);
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});


/*document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("comment-form");
  const commentInput = document.getElementById("userComment");
  const commentList = document.getElementById("posted-comments");
  const shoeId = document.querySelector(".comment-anchor")?.dataset?.shoeId;

  // ラジオの評価取得
  const getRatingArray = () => {
    const array = [];
    for (let i = 0; i < 10; i++) {
      const checked = document.querySelector(`input[name="rating-${i}"]:checked`);
      array.push(checked ? Number(checked.value) : 0);
    }
    return array;
  };

  // ★クリック時の装飾
  const stars = document.querySelectorAll(".star");
  stars.forEach(star => {
    star.addEventListener("click", () => {
      const index = star.dataset.index;
      const score = parseInt(star.dataset.score);

      const allStars = document.querySelectorAll(`.star[data-index="${index}"]`);
      allStars.forEach((s, i) => {
        if (i < score) {
          s.classList.add("selected");
        } else {
          s.classList.remove("selected");
        }
      });
    });
  });

  if (form && commentInput) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

       if (!currentUser) {
    alert("コメント投稿にはログインが必要です！");
    return;
  }

      const text = commentInput.value.trim();
      if (!text) return alert("コメントを入力してください");

       if (!nickname) {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      nickname = userDoc.data().nickname;
    } else {
      nickname = "匿名";
    }
  }

      const ratingArray = getRatingArray();
      console.log(ratingArray);

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: text,
          ratings: ratingArray,
          shoeId: shoeId,
           nickname: nickname        })
      });

      if (res.ok) {
  /*const li = document.createElement("li");
  li.textContent = `👤${nickname || "匿名"}：「${text}」 (${ratingArray.join(", ")})`;
  commentList.prepend(li);
  commentInput.value = "";*/
/*  const li = document.createElement("li");
li.innerHTML = `
  <div class="comment-block">
    👤${c.nickname || "匿名"}：「${c.comment}」 (${c.ratings.join(", ")})
    <div class="reply-list" data-comment-id="${c.id}"></div>
    <input type="text" class="reply-input" placeholder="返信を書く">
    <button class="reply-btn" data-comment-id="${c.id}">返信</button>
  </div>
`;
commentList.appendChild(li);

} else {
        alert("投稿に失敗しました");
      }
    });
  }

  // 平均チャート読み込み
  fetch(`/api/comments/${shoeId}`)
    .then(res => res.json())
    .then(data => {
      const { comments, avgRatings } = data;

     comments.forEach(c => {
  const li = document.createElement("li");
  li.textContent = `👤${c.nickname || "匿名"}：「${c.comment}」 (${c.ratings.join(", ")})`;
  commentList.appendChild(li);
});


      const avgCtx = document.getElementById("avgChart");
      new Chart(avgCtx, {
        type: "radar",
        data: {
          labels: ['クッション性','安定性','軽さ','コスパ','履き心地','デザイン','通気性','スピード','グリップ','耐久性'],
          datasets: [{
            label: "みんなの平均",
            data: avgRatings,
            fill: true,
            borderWidth: 2,
          }]
        },
        options: {
  responsive: true,
  scales: {
    r: {
      min: 0,
      max: 5,
      ticks: {
        stepSize: 1,
        backdropColor: 'transparent'
      }
    }
  }
}

      });
    });
});

const db = getFirestore();


onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      document.getElementById("nickname-popup").style.display = "block";

      document.getElementById("save-nickname").addEventListener("click", async () => {
        const nickname = document.getElementById("nickname-input").value.trim();
        if (!nickname) return alert("ニックネームを入力してね");

        await setDoc(docRef, {
          nickname: nickname,
          createdAt: new Date()
        });

        document.getElementById("nickname-popup").style.display = "none";
        alert("ニックネームを保存しました！");
      });
    }
  }
});


let nickname = null;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      nickname = userDoc.data().nickname;
    }
  }
});*/

// public/js/comment.js
(() => {
  const root = document.querySelector('.comments[data-shoe-id]') 
            || document.querySelector('.comment-anchor[data-shoe-id]');
  const shoeId = root?.dataset.shoeId;
  if (!shoeId) {
    console.error('[comment.js] shoeIdが取れない: .comments or .comment-anchor の data-shoe-id を確認して');
    return;
  }

  const form  = document.getElementById('comment-form');
  const list  = document.getElementById('posted-comments');
  const more  = document.getElementById('more-btn');
  let nextCursor = null;
  const labels = ['クッション','安定性','軽さ','コスパ','履き心地','デザイン','通気性','スピード','グリップ','耐久性'];

  function esc(s){return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m]));}

  async function loadComments(append=false){
    try{
      const url = new URL(`/api/comments/${encodeURIComponent(shoeId)}`, window.location.origin);
      url.searchParams.set('limit','10');
      if (nextCursor) url.searchParams.set('cursor', nextCursor);
      const res = await fetch(url.toString());
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) throw new Error(data?.error || `GET ${res.status}`);

      renderAvg(data.avgRatings, data.count);
      renderList(data.comments || [], append);
      nextCursor = data.nextCursor || null;
      if (more) more.style.display = nextCursor ? 'inline-block' : 'none';
    }catch(e){
      console.error('[comment.js] loadComments failed:', e);
      alert('コメント取得に失敗したよ… サーバログも見てみて');
    }
  }

  function renderAvg(avg, count){
    const wrap = document.getElementById('avgWrap');
    if (!wrap) return;
    if (!avg || !avg.some(v=>v>0)) { wrap.innerHTML = '<p class="muted">まだ評価がありません</p>'; return; }
    wrap.innerHTML = '<canvas id="avgChart" width="380" height="380" aria-label="みんなの平均レーダー" role="img"></canvas>';
    if (!window.Chart) return;
    new Chart(document.getElementById('avgChart'), {
      type: 'radar',
      data: { labels, datasets: [{ label: `みんなの平均（n=${count||0}）`, data: avg, pointRadius: 2, fill: true }] },
      options: { maintainAspectRatio:false, responsive:true, plugins:{legend:{display:false}},
        scales:{ r:{ min:0, max:5, ticks:{ stepSize:1, backdropColor:'transparent' } } } }
    });
  }

  function renderList(items, append){
    if (!list) return;
    if (!append) list.innerHTML = '';
    items.forEach(d=>{
      const when = d.createdAt ? new Date(d.createdAt).toLocaleString() : '';
      const stars = Array.isArray(d.ratings) ? d.ratings.map(v=> '★'.repeat(v)+'☆'.repeat(5-v)).join(' / ') : '';
      const li = document.createElement('li');
      li.innerHTML = `<article class="review">
        <header><span class="nick">${esc(d.nickname||'匿名')}</span><time datetime="${esc(d.createdAt||'')}">${esc(when)}</time></header>
        <p class="body">${esc(d.comment||'')}</p>
        <p class="mini-stars">${esc(stars)}</p>
      </article>`;
      list.appendChild(li);
    });
  }

  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    try{
      const nickname = document.getElementById('nickname')?.value?.trim() || '';
      const comment  = document.getElementById('userComment')?.value?.trim() || '';
      const ratings = [];
      for(let i=0;i<10;i++){
        const v = Number((document.querySelector(`input[name="rating-${i}"]:checked`)||{}).value || 0);
        ratings.push(v);
      }
      if (!comment || comment.length < 3) { alert('本文を3文字以上書いてね'); return; }
      if (ratings.some(v=> v<1 || v>5)) { alert('各項目の★を1〜5で選んでから投稿してね！'); return; }

      const res = await fetch('/api/comments', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ shoeId, comment, ratings, nickname })
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) throw new Error(data?.error || `POST ${res.status}`);

      // reset
      document.getElementById('userComment').value = '';
      for(let i=0;i<10;i++){
        const chk = document.querySelector(`input[name="rating-${i}"]:checked`);
        if (chk) chk.checked = false;
      }
      nextCursor = null;
      await loadComments(false);
      const t = document.querySelector('.list-title'); if (t) window.scrollTo({ top: t.offsetTop-80, behavior:'smooth' });
    }catch(e){
      console.error('[comment.js] submit failed:', e);
      alert('投稿に失敗したよ… ' + e.message);
    }
  });

  more?.addEventListener('click', ()=> loadComments(true));

  // 初回
  loadComments();
})();
