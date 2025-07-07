/*const admin = require('firebase-admin');

const base64 = process.env.FIREBASE_KEY; // ← Renderに設定した環境変数
const jsonString = Buffer.from(base64, 'base64').toString('utf8');
const serviceAccount = JSON.parse(jsonString);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { db };*/

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // ← 相対パス注意！

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { db };
