/*const admin = require('firebase-admin');

const base64 = process.env.FIREBASE_KEY; // ← Renderに設定した環境変数
const jsonString = Buffer.from(base64, 'base64').toString('utf8');
const serviceAccount = JSON.parse(jsonString);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { db };

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // ← 相対パス注意！

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { db };*/

// /firebase/admin.js
const admin = require('firebase-admin');

function loadCreds() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    const raw = JSON.parse(json); // keys: project_id, client_email, private_key
    // camelCaseに正規化
    return {
      projectId:   raw.project_id   || raw.projectId,
      clientEmail: raw.client_email || raw.clientEmail,
      privateKey:  (raw.private_key || raw.privateKey)?.replace(/\\n/g, '\n'),
      // admin.credential.cert は余分なキーがあっても無視するが，念のため必要分だけ渡す
    };
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }
  try {
    // ローカルJSON（git管理しない）
    // serviceAccountKey.json は下線キーだが，admin.credential.cert にそのまま渡してもOK
    const raw = require('./serviceAccountKey.json');
    return {
      projectId:   raw.project_id   || raw.projectId,
      clientEmail: raw.client_email || raw.clientEmail,
      privateKey:  (raw.private_key || raw.privateKey)?.replace(/\\n/g, '\n'),
    };
  } catch { return {}; }
}

const creds = loadCreds();
if (!creds.projectId || !creds.clientEmail || !creds.privateKey) {
  console.error('[firebase-admin] creds missing parts:', creds);
  throw new Error('Firebase Admin credentials are incomplete.');
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(creds) });
  console.log('[firebase-admin] initialized for project:', creds.projectId);
}

module.exports = { admin, db: admin.firestore() };
