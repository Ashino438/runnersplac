// /firebase/admin.js
const admin = require('firebase-admin');

function loadCreds() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    const raw = JSON.parse(json);
    return {
      projectId:   raw.project_id,
      clientEmail: raw.client_email,
      privateKey:  raw.private_key?.replace(/\\n/g, '\n'),
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
    const raw = require('./serviceAccountKey.json');
    return {
      projectId:   raw.project_id,
      clientEmail: raw.client_email,
      privateKey:  raw.private_key?.replace(/\\n/g, '\n'),
    };
  } catch { return {}; }
}

const creds = loadCreds();
if (!creds.projectId || !creds.clientEmail || !creds.privateKey) {
  console.error('[firebase-admin] creds missing parts:', creds);
  throw new Error('Firebase Admin credentials are incomplete.');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   creds.projectId,
      clientEmail: creds.clientEmail,
      privateKey:  creds.privateKey,
    }),
    projectId: creds.projectId,                           // 明示
    storageBucket: `${creds.projectId}.appspot.com`,     // ← これが正解
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
