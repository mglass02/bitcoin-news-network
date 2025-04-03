const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cron = require('node-cron'); // Add node-cron for scheduling
const app = express();

let topHoldersCache = []; // Variable to hold the cached data

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

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
      
      // Extract the BTC amount from the 'founded' column (as seen in the data)
      const btcText = $(cells[4]).text().trim().replace(/,/g, '');  // BTC is now in the 'founded' column
      const btc = parseFloat(btcText.replace('₿', '').trim());

      // Clean and extract the company name (remove emojis or symbols)
      let name = $(cells[0]).text().trim();
      name = name.replace(/[^\w\s]/g, '');  // Remove non-word characters like emojis and symbols

      // Only add to the list if the BTC amount is greater than 1000 and the name is valid
      if (btc && btc > 1000 && name) {
        holders.push({
          name: name,
          btc: btc,
          founded: $(cells[4]).text().trim() || 'N/A',  // Keeping the 'founded' column value for reference
          hq: $(cells[5]).text().trim() || 'N/A',  // 'hq' is still in its original column
          desc: $(cells[1]).text().trim() || 'N/A'  // Description is still from its original column
        });
      }
    });

    // Log the cleaned holders data for analysis
    console.log('Cleaned data (Filtered):', holders);

    return holders.sort((a, b) => b.btc - a.btc); // Sort by BTC descending
  } catch (error) {
    console.error('Error fetching top holders:', error);
    return []; // Fallback to empty array
  }
}


// Schedule a task to scrape data every 12 hours
cron.schedule('0 0 */12 * *', async () => {
  console.log('Scraping top holders...');
  topHoldersCache = await fetchTopHolders();
  console.log('Top holders data updated!');
});

// Fetch data for the top holders (use the cache to avoid fetching too often)
async function getTopHolders() {
  if (topHoldersCache.length === 0) { // If cache is empty, fetch new data
    topHoldersCache = await fetchTopHolders();
  }
  return topHoldersCache;
}

// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/news', (req, res) => {
  res.render('news');
});

app.get('/top-holders', async (req, res) => {
  const holders = await getTopHolders(); // Use the cached data
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
  const holders = await getTopHolders();
  res.json(holders); // Return the raw data in JSON format
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`BNN app running on port ${PORT}`));
