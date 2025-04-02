const express = require('express');
const path = require('path');
const fetch = require('node-fetch'); // Add this
const { parseString } = require('xml2js'); // Add this
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

// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/news', (req, res) => {
  res.render('news');
});

app.get('/top-holders', (req, res) => {
  res.render('top-holders');
});

app.get("/api/news", async (req, res) => {
  const query = req.query.q || "bitcoin+legislation";
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  console.log(`Fetching news for: ${query}`); // Debug start
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" } // Google might block default Node requests
    });
    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const text = await response.text();
    console.log("Got RSS feed, parsing..."); // Debug fetch success
    parseString(text, (err, result) => {
      if (err) {
        console.error("XML parsing failed:", err);
        return res.status(500).json([{ title: "Error parsing news", link: "#" }]);
      }
      console.log("Parsed XML, sending items"); // Debug parsing success
      const items = result.rss.channel[0].item.map(item => ({
        title: item.title[0],
        link: item.link[0],
      }));
      res.json(items);
    });
  } catch (error) {
    console.error("News fetch error:", error.message);
    res.status(500).json([{ title: "Failed to load news", link: "#" }]);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`BNN app running on port ${PORT}`));