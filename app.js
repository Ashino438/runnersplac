const express = require('express');
const app = express();
const formRouter = require('./routes/form');
const resultRouter = require('./routes/result');
const reviewRouter = require('./routes/review');

app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.use('/form', formRouter);
app.use('/result', resultRouter);
app.use('/review', reviewRouter);

app.get('/', (req, res) => {
  res.redirect('/form');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} でサーバーが起動しました`);
});
