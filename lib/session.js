// lib/session.js
const { admin } = require('../firebase/admin');

const ADMIN_UIDS = new Set(['7MAnXoevBOZG80P0LivUnIn2hTu1']);

async function getUserFromSessionCookie(req) {
  const cookie = req.cookies?.__session;
  if (!cookie) return null;
  try {
    const decoded = await admin.auth().verifySessionCookie(cookie, true);
    return decoded;
  } catch (e) {
    console.error('[DBG] verifySessionCookie error:', e.message);
    return null;
  }
}

async function exposeUser(req, res, next) {
  const decoded = await getUserFromSessionCookie(req);
  if (decoded) {
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      isAdmin: decoded.isAdmin === true || ADMIN_UIDS.has(decoded.uid),
    };
    res.locals.user = req.user;
  } else {
    req.user = null;
    res.locals.user = null;
  }
  next();
}

//function sessionMiddleware(app){ return app.use((req,_res,next)=>next()); }

function sessionMiddleware(app){
  return app.use(exposeUser); // ← no-opやめてこれ
}

function requireAuth() {
  return async (req, res, next) => {
    const decoded = await getUserFromSessionCookie(req);
    if (!decoded) return res.status(401).json({ ok:false, msg:'unauthorized' });
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      isAdmin: decoded.isAdmin === true || ADMIN_UIDS.has(decoded.uid),
    };
    next();
  };
}

// ★ これを追加（routes/auth.js から呼ばれる）
async function createSessionCookie(idToken, expiresIn){
  return admin.auth().createSessionCookie(idToken, { expiresIn });
}



module.exports = { sessionMiddleware, exposeUser, requireAuth, createSessionCookie };
