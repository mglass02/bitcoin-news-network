const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  if (req.path === '/style.css') {
    res.setHeader('Content-Type', 'text/css');
  }
  next();
});

// Routes moved from router
app.get('/', (req, res) => {
  res.render('home'); // Changed from 'index' to match router intent
});

app.get('/news', (req, res) => {
  res.render('news');
});

app.get('/top-holders', (req, res) => {
  res.render('top-holders');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`BNN app running on port ${PORT}`));