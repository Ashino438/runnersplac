const express = require("express");
const router = express.Router();
const { db } = require('../../firebase/admin'); // ← ✅ 分割代入にする
;

router.post("/", async (req, res) => {
  const { shoeId, comment, ratings } = req.body;

  if (!shoeId || !comment || !Array.isArray(ratings)) {
    return res.status(400).json({ error: "データ不正" });
  }

  try {
    await db
      .collection("comments")
      .doc(shoeId)
      .collection("userComments")
      .add({
        comment,
        ratings,
        createdAt: new Date().toISOString()
      });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Firestore保存失敗:", err);
    res.status(500).json({ error: "保存エラー" });
  }
});

// routes/api/comments.js の中
router.get("/:shoeId", async (req, res) => {
  const { shoeId } = req.params;

  try {
    const snapshot = await db
      .collection("comments")
      .doc(shoeId)
      .collection("userComments")
      .orderBy("createdAt", "desc")
      .get();

    const comments = [];
    const ratingSums = Array(10).fill(0);
    let count = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      comments.push(data);
      if (Array.isArray(data.ratings)) {
        data.ratings.forEach((r, i) => ratingSums[i] += r);
      }
      count++;
    });

    const avgRatings = ratingSums.map(total => count ? (total / count) : 0);

    res.json({
      comments,
      avgRatings
    });
  } catch (err) {
    console.error("取得失敗:", err);
    res.status(500).json({ error: "コメント取得エラー" });
  }
});


module.exports = router;
