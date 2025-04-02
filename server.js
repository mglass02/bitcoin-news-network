const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const { parseString } = require('xml2js');
const cheerio = require('cheerio');
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

// Fetch top holders dynamically from bitcointreasuries.net
async function fetchTopHolders() {
  try {
    const response = await fetch('https://bitcointreasuries.net/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    const holders = [];
    $('table tbody tr').each((i, row) => {
      const cells = $(row).find('td');
      const btcText = $(cells[2]).text().trim().replace(/,/g, '');
      const btc = parseFloat(btcText);

      if (btc > 1000) { // Filter for >1,000 BTC
        holders.push({
          name: $(cells[0]).text().trim(),
          btc: btc,
          founded: $(cells[4]).text().trim() || 'N/A', // Some fields may not exist
          hq: $(cells[5]).text().trim() || 'N/A',
          desc: $(cells[1]).text().trim() || 'N/A'
        });
      }
    });

    return holders.sort((a, b) => b.btc - a.btc); // Sort by BTC descending
  } catch (error) {
    console.error('Error fetching top holders:', error);
    return []; // Fallback to empty array
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/news', (req, res) => {
  res.render('news');
});

app.get('/top-holders', async (req, res) => {
  const holders = await fetchTopHolders();
  res.render('top-holders', { holders });
});

app.get('/api/news', async (req, res) => {
  const query = req.query.q || 'bitcoin+legislation';
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const text = await response.text();
    parseString(text, (err, result) => {
      if (err) return res.status(500).json([{ title: 'Error parsing news', link: '#' }]);
      const items = result.rss.channel[0].item.map(item => ({
        title: item.title[0],
        link: item.link[0],
      }));
      res.json(items);
    });
  } catch (error) {
    console.error('News fetch error:', error.message);
    res.status(500).json([{ title: 'Failed to load news', link: '#' }]);
  }
});

app.get('/api/top-holders', async (req, res) => {
  const holders = await fetchTopHolders();
  res.json(holders);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`BNN app running on port ${PORT}`));