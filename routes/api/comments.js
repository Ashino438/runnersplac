// routes/api/comments.js
const express = require("express");
const router = express.Router();
const { db, admin } = require("../../firebase/admin");
const { Timestamp, FieldValue } = admin.firestore;

function validatePayload(body) {
  const { shoeId, comment, ratings, nickname } = body || {};
  if (typeof shoeId !== "string" || !shoeId.trim()) return "invalid shoeId";
  if (typeof comment !== "string" || comment.trim().length < 3) return "comment too short";
  if (!Array.isArray(ratings) || ratings.length !== 10) return "ratings must be length 10";
  for (const r of ratings) if (typeof r !== "number" || r < 1 || r > 5) return "ratings must be 1..5";
  if (nickname && typeof nickname !== "string") return "invalid nickname";
  return null;
}

// ---- POST ----
// ---- POST: 追加（集計も同時更新）----
router.post("/", async (req, res) => {
  const errMsg = validatePayload(req.body);
  if (errMsg) return res.status(400).json({ error: errMsg });

  const { shoeId, comment, ratings, nickname } = req.body;
  const trimmed = comment.trim().slice(0, 4000);
  const name = (nickname || "匿名").slice(0, 50);

  const commentsCol = db.collection("comments").doc(shoeId).collection("userComments");
  const statsDocRef = db.collection("comments").doc(shoeId).collection("_meta").doc("stats");

  try {
    const nowTs = admin.firestore.Timestamp.now();
    const nowISO = new Date().toISOString();

    await db.runTransaction(async (tx) => {
      // 👇 まず集計ドキュメントを読む（全リードを最初に）
      const snap = await tx.get(statsDocRef);

      // 👇 その後にコメントを書き込み
      const newRef = commentsCol.doc();
      tx.set(newRef, {
        comment: trimmed,
        ratings,
        nickname: name,
        createdAt: nowTs,
        createdAtISO: nowISO,
      });

      // 集計の更新
      if (!snap.exists) {
        tx.set(statsDocRef, {
          count: 1,
          sums: ratings.slice(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const data = snap.data() || {};
        const sums = Array.isArray(data.sums) && data.sums.length === 10 ? data.sums : Array(10).fill(0);
        const nextSums = sums.map((v, i) => v + ratings[i]);
        tx.update(statsDocRef, {
          count: (data.count || 0) + 1,
          sums: nextSums,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    res.json({ success: true });
  } catch (e) {
    console.error("Firestore保存失敗:", e);
    res.status(500).json({ error: e.message || "保存エラー" });
  }
});


// ---- GET ----
router.get("/:shoeId", async (req, res) => {
  const { shoeId } = req.params;
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);
  const cursorISO = req.query.cursor;

  try {
    const buildQuery = (field) => {
      let q = db.collection("comments").doc(shoeId).collection("userComments")
        .orderBy(field, "desc").limit(limit);
      if (cursorISO) q = q.startAfter(new Date(cursorISO));
      return q;
    };

    let listSnap;
    try {
      listSnap = await buildQuery("createdAt").get();
    } catch (err) {
      console.warn("[comments] fallback createdAtISO:", err.message);
      listSnap = await buildQuery("createdAtISO").get();
    }

    const statsSnap = await db.collection("comments").doc(shoeId).collection("_meta").doc("stats").get();

    const comments = [];
    let nextCursor = null;

    listSnap.forEach((doc) => {
      const d = doc.data();
      const t = d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAtISO ? new Date(d.createdAtISO) : null);
      comments.push({
        comment: d.comment,
        ratings: d.ratings,
        nickname: d.nickname || "匿名",
        createdAt: t ? t.toISOString() : null
      });
    });

    if (!listSnap.empty) {
      const last = comments[comments.length - 1];
      nextCursor = last?.createdAt || null;
    }

    let avgRatings = Array(10).fill(0);
    let count = 0;
    if (statsSnap.exists) {
      const s = statsSnap.data() || {};
      count = s.count || 0;
      const sums = Array.isArray(s.sums) && s.sums.length === 10 ? s.sums : Array(10).fill(0);
      avgRatings = count ? sums.map(v => Math.round((v / count) * 10) / 10) : avgRatings;
    }

    res.json({ comments, avgRatings, count, nextCursor });
  } catch (e) {
    console.error("取得失敗:", e);
    res.status(500).json({ error: e.message || "コメント取得エラー" });
  }
});

module.exports = router;
