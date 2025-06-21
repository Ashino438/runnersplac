const express = require('express');
const app = express();
const formRouter = require('./routes/form');
const vomero18Router = require('./routes/form_vomero18');
const resultRouter = require('./routes/result');
const resultvomero18Router = require('./routes/result_vomero18');
const reviewRouter = require('./routes/review');
const homeRouter = require('./routes/home');

const shoeRoutes = require('./routes/shoes');
const commentRoute = require("./routes/api/comments");




app.use(express.json());
app.use(express.static('public'));
app.use('/firebase', express.static(__dirname + '/firebase'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.use('/home', homeRouter);
app.use('/form', formRouter);
app.use('/form_vomero18', vomero18Router);
app.use('/result', resultRouter);
app.use('/result_vomero18', resultvomero18Router);
app.use('/review', reviewRouter);
app.use('/shoes', shoeRoutes);
app.use("/api/comments", commentRoute);
app.get('/', (req, res) => {
  res.redirect('/home');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} でサーバーが起動しました`);
});
