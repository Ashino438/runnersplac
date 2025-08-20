require('dotenv').config();
const express = require('express');
const app = express();
const formRouter = require('./routes/form');
const vomero18Router = require('./routes/form_vomero18');
const resultRouter = require('./routes/result');
const resultvomero18Router = require('./routes/result_vomero18');
const reviewRouter = require('./routes/review');
const homeRouter = require('./routes/home');
const path = require('path');
const cookieParser = require('cookie-parser');

const { sessionMiddleware, exposeUser } = require('./lib/session');
const home2 = require('./routes/home2');
const auth = require('./routes/auth');
const wishlist = require('./routes/wishlist');
const profile = require('./routes/profile');

const shoeRoutes = require('./routes/shoes');
const commentRoute = require("./routes/api/comments");
const shoeData = require(path.join(__dirname, 'data', 'shoesdata.json'));
function attachScores(list){
  return list.map(s=>{
    const cd = Array.isArray(s.chartData) ? s.chartData : [];
    const get = (i)=> (typeof cd[i] === 'number' ? cd[i] : null);
    const score = {
      cushion:       get(0),  // クッション性
      stability:     get(1),  // 安定性
      lightness:     get(2),  // 軽さ
      cost:          get(3),  // コスパ
      fit:           get(4),  // 履き心地
      design:        get(5),  // デザイン
      breathability: get(6),  // 通気性
      speed:         get(7),  // スピード性能
      grip:          get(8),  // グリップ
      durability:    get(9)   // 耐久性
    };
    const nums = Object.values(score).filter(v=>typeof v==='number');
    const overall = nums.length ? Math.round((nums.reduce((a,b)=>a+b,0)/nums.length)*10)/10 : null;
    return { ...s, score: { ...score, overall } };
  });
}





app.use(express.json());
app.use(express.static('public'));
app.use('/firebase', express.static(__dirname + '/firebase'));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(cookieParser());


app.use('/form', formRouter);
app.use('/form_vomero18', vomero18Router);
app.use('/result', resultRouter);
app.use('/result_vomero18', resultvomero18Router);
app.use('/review', reviewRouter);
app.use('/shoes', shoeRoutes);
app.use("/api/comments", commentRoute);
app.use('/api/comments', require('./routes/api/comments')); // ← これでOK


app.use((req, res, next) => {
  res.locals.req = req;                // header.ejs がそのまま req を使える
  res.locals.currentUrl = req.originalUrl; // 使いたければこっちも
  next();
});


sessionMiddleware(app);
app.use(exposeUser);

app.get('/', (req, res) => {
  const i = req.originalUrl.indexOf('?');
  const qs = i >= 0 ? req.originalUrl.slice(i) : '';
  res.redirect(302, '/home2' + qs);
});

app.get('/home', (req, res) => {
  const i = req.originalUrl.indexOf('?');
  const qs = i >= 0 ? req.originalUrl.slice(i) : '';
  res.redirect(301, '/home2' + qs);
});

app.use('/', auth);
app.use('/', home2);
app.use('/', wishlist);
app.use('/', profile);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} でサーバーが起動しました`);
});

