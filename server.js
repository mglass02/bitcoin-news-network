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

app.get('/', (req, res) => {
    res.render('index'); 
  });

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`BNN app running on port ${PORT}`));