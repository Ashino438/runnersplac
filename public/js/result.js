const dataEl = document.getElementById('data');
const myRatings = JSON.parse(dataEl.dataset.my);
const avgRatings = JSON.parse(dataEl.dataset.avg);

const ctx = document.getElementById('ratingChart').getContext('2d');

new Chart(ctx, {
  type: 'radar',
  data: {
    labels: [
      "クッション性", "安定性", "軽さ", "コスパ", "履き心地",
      "デザイン", "通気性", "スピード", "グリップ", "耐久性"
    ],
    datasets: [
      {
        label: 'あなたの評価',
        data: myRatings,
        borderWidth: 2
      },
      {
        label: '全体の平均',
        data: avgRatings,
        borderWidth: 2
      }
    ]
  },
  options: {
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    }
  }
});
