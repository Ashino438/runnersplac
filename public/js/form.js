document.getElementById('ratingForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const formData = new FormData(e.target);
    const ratings = [];
  
    for (let i = 0; i < 10; i++) {
      const val = formData.get(`category${i}`);
      ratings.push(Number(val));
    }
  
    const comment = formData.get('comment');
  
    const payload = {
      ratings: ratings,
      comment: comment
    };
  
    try {
      const res = await fetch('/form/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (res.ok) {
        window.location.href = '/result'; // 結果ページへリダイレクト
      } else {
        alert('送信に失敗しました');
      }
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました');
    }
  });
  