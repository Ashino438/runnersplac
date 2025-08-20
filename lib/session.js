// /lib/session.js
const { admin } = require('../firebase/admin');

async function createSessionCookie(idToken, expiresIn) {
  await admin.auth().verifyIdToken(idToken, true);               // 署名＋発行元検証
  return admin.auth().createSessionCookie(idToken, { expiresIn }); // セッションクッキー発行
}

async function getUserFromSessionCookie(req) {
  const cookie = req.cookies?.__session;
  if (!cookie) return null;
  try {
    return await admin.auth().verifySessionCookie(cookie, true);
  } catch {
    return null;
  }
}

function sessionMiddleware(app) {
  // ここでは何もしない（初期化は/firebase/admin.jsに集約）
  return app.use((req, _res, next) => next());
}

async function exposeUser(req, res, next) {
  const u = await getUserFromSessionCookie(req);
  if (u) {
    req.user = u;
    res.locals.user = u;
  }
  next();
}
function requireAuth() {
  return async (req, res, next) => {
    const u = await getUserFromSessionCookie(req);
    if (!u) return res.status(401).json({ ok:false, msg:'unauthorized' });
    req.user = u;
    next();
  };
}
module.exports = { createSessionCookie, sessionMiddleware, exposeUser, requireAuth };