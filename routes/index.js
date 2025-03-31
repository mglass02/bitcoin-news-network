const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('home');
});

router.get('/news', (req, res) => {
    res.render('news');
});

router.get('/top-holders', (req, res) => {
    res.render('top-holders');
});

module.exports = router;
