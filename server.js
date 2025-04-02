const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const { parseString } = require('xml2js');
const cheerio = require('cheerio');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

async function fetchTopHolders() {
  try {
    console.log('Fetching data from bitcointreasuries.net...');
    const response = await fetch('https://bitcointreasuries.net/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const html = await response.text();
    console.log('Received HTML, length:', html.length);
    const $ = cheerio.load(html);
    const holders = [];
    const rows = $('table tbody tr');

    if (rows.length === 0) {
      console.log('No table rows found in HTML');
    } else {
      console.log(`Found ${rows.length} table rows`);
    }

    rows.each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 6) {
        console.log(`Row ${i} has insufficient cells: ${cells.length}`);
        return;
      }

      // Log all cell contents for debugging
      console.log(`Row ${i}: Name: ${$(cells[0]).text().trim()}, Desc: ${$(cells[1]).text().trim()}, Market Cap: ${$(cells[2]).text().trim()}, BTC: ${$(cells[3]).text().trim()}, Founded: ${$(cells[4]).text().trim()}, HQ: ${$(cells[5]).text().trim()}`);

      const btcRaw = $(cells[4]).text().trim(); // Use cells[4] for BTC (Founded column)
      let btc = 0;
      if (btcRaw && btcRaw !== '—') {
        const btcMatch = btcRaw.match(/₿\s*([\d,.]+)/);
        if (btcMatch) {
          btc = parseFloat(btcMatch[1].replace(/,/g, '')) || 0;
        }
      }

      if (btc > 1000) {
        const holder = {
          name: $(cells[0]).text().trim() || 'Unknown',
          btc: btc,
          btcValueUsd: $(cells[3]).text().trim() || 'N/A', // Keep USD for display
          founded: $(cells[4]).text().trim() || 'N/A',
          hq: $(cells[5]).text().trim() || 'N/A',
          desc: $(cells[1]).text().trim() || 'N/A'
        };
        holders.push(holder);
        console.log(`Added holder: ${holder.name} with ${holder.btc} BTC`);
      } else {
        console.log(`Row ${i} skipped: BTC (${btc}) <= 1,000`);
      }
    });

    console.log(`Returning ${holders.length} holders with >1,000 BTC`);
    return holders.sort((a, b) => b.btc - a.btc);
  } catch (error) {
    console.error('Error in fetchTopHolders:', error.message);
    return [];
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