const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('home', { activePage: 'home' });
});

router.get('/news', (req, res) => {
    res.render('news', { activePage: 'news' });
});

router.get('/top-holders', (req, res) => {
    res.render('top-holders', { activePage: 'top-holders' });
});

module.exports = router;
