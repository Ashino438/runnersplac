document.addEventListener("DOMContentLoaded", () => {
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

      const text = commentInput.value.trim();
      if (!text) return alert("コメントを入力してください");

      const ratingArray = getRatingArray();
      console.log(ratingArray);

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: text,
          ratings: ratingArray,
          shoeId: shoeId
        })
      });

      if (res.ok) {
        const li = document.createElement("li");
        li.innerHTML = `★投稿: ${text}（${ratingArray.join(", ")}）`;
        commentList.prepend(li);
        commentInput.value = "";
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
        li.textContent = `「${c.comment}」 (${c.ratings.join(", ")})`;
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
