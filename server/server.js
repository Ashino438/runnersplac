const express = require('express');
const app = express();
const path = require('path');

app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');

// Mount admin articles router
try {
  const adminArticles = require('./admin-articles');
  app.use('/admin/articles', adminArticles);
} catch (e) { console.warn('admin-articles router not found', e.message); }

// Mount blogs router
try {
  const blogs = require('./blogs');
  app.use('/blog', blogs);
} catch (e) { console.warn('blogs router not found', e.message); }

// Mount reviews router
try {
  const reviewsApi = require('./reviews');
  app.use('/api/reviews', reviewsApi);
} catch (e) { console.warn('reviews router not found', e.message); }

// Serve data and uploads for preview
app.use('/data/articles', express.static(path.join(process.cwd(), 'data', 'articles')));
app.use('/uploads/articles', express.static(path.join(process.cwd(), 'public', 'uploads', 'articles')));

// Serve reviews data for debug
app.use('/data/reviews', express.static(path.join(process.cwd(), 'data', 'reviews')));

module.exports = app;