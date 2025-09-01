

// /public/js/auth.js
/*(() => {
  const cfg = {
    apiKey: "AIzaSyBbFaRwIiYw61X5yKXhvt1nGw-MRSgagLo",
    authDomain: "mystlide.firebaseapp.com",
  };

  // 1) DOMできてから実行（ボタンが無い問題を回避）
  document.addEventListener('DOMContentLoaded', () => loadFirebase());

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function loadFirebase(){
    // 2) 依存順に確実に読み込む（app → auth）
    await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js');

    // 3) 初期化
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    const btn = document.getElementById('loginBtn');
    if (!btn) return console.warn('[auth] loginBtn not found');

    btn.addEventListener('click', async () => {
      try {
        console.log('[auth] start popup');
        const res = await auth.signInWithPopup(provider);
        console.log('[auth] popup ok', res?.user?.uid, res?.user?.email);

        // 4) セッションクッキー用に最新トークンを確実に取得
        const idToken = await res.user.getIdToken(/* forceRefresh  true);
        console.log('[auth] idToken len=', idToken?.length || 0);

        const r = await fetch('/api/sessionLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        console.log('[auth] sessionLogin status', r.status);
        const j = await r.json().catch(()=>null);
        console.log('[auth] sessionLogin body', j);
        if (!r.ok || !j?.ok) throw new Error(j?.msg || 'session login failed');

        // 5) ここで Set-Cookie: __session が返ってるはず
        location.href = window.__afterLoginRedirect || '/home2';
      } catch (e) {
        console.error('[auth] ERROR', e);
        alert('ログインに失敗：' + (e?.message || e));
      }
    });
  }
})();*/
// /public/js/auth.js  ← <script defer> で読み込む
(function () {
  const cfg = {
    apiKey: "AIzaSyBbFaRwIiYw61X5yKXhvt1nGw-MRSgagLo",
    authDomain: "mystlide.firebaseapp.com",
  };

  function log(...a){ console.log('[auth]', ...a); }

  async function init() {
    if (!firebase?.apps?.length) firebase.initializeApp(cfg);
    const auth = firebase.auth();
    auth.useDeviceLanguage();
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    const redirectTo = (window.__afterLoginRedirect && !String(window.__afterLoginRedirect).startsWith('/login'))
      ? window.__afterLoginRedirect : '/home2';

    // 1回だけリダイレクトを許すフラグ
    const RD_KEY = 'auth.didRedirect';

    // 既にFirebase的にログイン済みでサーバークッキー未発行なら発行して遷移
    if (auth.currentUser && !document.cookie.includes('__session=')) {
      await issueSessionAndGo(auth.currentUser, redirectTo);
      return;
    }

    // リダイレクト復帰の結果を一度だけ処理
    try {
      const rr = await auth.getRedirectResult();
      if (rr && rr.user) {
        sessionStorage.removeItem(RD_KEY);
        await issueSessionAndGo(rr.user, redirectTo);
        return;
      }
    } catch (e) {
      console.warn('[auth] redirect result err', e);
      sessionStorage.removeItem(RD_KEY);
    }

    const btn = document.getElementById('loginBtn');
    if (!btn) { console.warn('[auth] #loginBtn not found'); return; }

    let inFlight = false;
    btn.addEventListener('click', async () => {
      if (inFlight) return;
      inFlight = true; btn.disabled = true;
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const res = await auth.signInWithPopup(provider);
        await issueSessionAndGo(res.user, redirectTo);
      } catch (e) {
        const popupCodes = [
          'auth/popup-blocked',
          'auth/cancelled-popup-request',
          'auth/popup-closed-by-user'
        ];
        if (popupCodes.includes(e.code) && !sessionStorage.getItem(RD_KEY)) {
          sessionStorage.setItem(RD_KEY, '1');
          await auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
          return;
        }
        console.error('[auth] popup error', e);
        alert('ログインできなかった…もう一度試してね。');
      } finally {
        inFlight = false; btn.disabled = false;
      }
    });

    async function issueSessionAndGo(user, to) {
      if (!document.cookie.includes('__session=')) {
        const idToken = await user.getIdToken(true);
        const r = await fetch('/api/sessionLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok) throw new Error(j?.msg || ('status ' + r.status));
      }
      location.href = to;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


