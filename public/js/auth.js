(() => {
  const cfg = {
      apiKey: "AIzaSyBbFaRwIiYw61X5yKXhvt1nGw-MRSgagLo",
      authDomain: "mystlide.firebaseapp.com",
  };

  let initialized=false;
  function loadFirebase(){
    if(initialized) return;
    const s1=document.createElement('script'); s1.src='https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js';
    const s2=document.createElement('script'); s2.src='https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js';
    s2.onload = ()=>{
      firebase.initializeApp(cfg);
      const auth = firebase.auth();
      const provider = new firebase.auth.GoogleAuthProvider();
      document.getElementById('loginBtn')?.addEventListener('click', async ()=>{
  try{
    console.log('[auth] start popup');
    const res = await auth.signInWithPopup(provider);
    console.log('[auth] popup ok', res?.user?.uid, res?.user?.email);

    const idToken = await res.user.getIdToken();
    console.log('[auth] got idToken', idToken ? 'len='+idToken.length : 'none');

    const r = await fetch('/api/sessionLogin', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ idToken })
    });
    console.log('[auth] sessionLogin status', r.status);
    const j = await r.json().catch(()=>null);
    console.log('[auth] sessionLogin body', j);

    if (!r.ok || !j?.ok) throw new Error(j?.msg || 'session login failed');
    location.href = window.__afterLoginRedirect || '/home2';
  }catch(e){
    console.error('[auth] ERROR', e);
    alert('ログインに失敗：' + (e?.message || e));
  }
});
    };
    document.head.appendChild(s1); document.head.appendChild(s2);
    initialized=true;
  }
  loadFirebase();
})();
