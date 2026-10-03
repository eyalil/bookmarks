const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const BOOKMARKS_FILE = path.join(__dirname, 'bookmarks.json');

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Load bookmarks from file
function loadBookmarks() {
  try {
    if (fs.existsSync(BOOKMARKS_FILE)) {
      const data = fs.readFileSync(BOOKMARKS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading bookmarks:', error);
  }
  return [];
}

// Save bookmarks to file
function saveBookmarks(bookmarks) {
  try {
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
  } catch (error) {
    console.error('Error saving bookmarks:', error);
  }
}

// GET / - Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /api/bookmarks - Get all bookmarks
app.get('/api/bookmarks', (req, res) => {
  const bookmarks = loadBookmarks();
  res.json(bookmarks);
});

// POST /api/bookmarks - Add a new bookmark
app.post('/api/bookmarks', (req, res) => {
  const { url, title, category } = req.body;

  // Validation
  if (!url || !title || !category) {
    return res.status(400).json({ error: 'URL, title, and category are required' });
  }

  const bookmarks = loadBookmarks();
  const newBookmark = {
    id: Date.now(),
    url,
    title,
    category,
    createdAt: new Date().toISOString()
  };

  bookmarks.push(newBookmark);
  saveBookmarks(bookmarks);

  res.json({ success: true, bookmark: newBookmark });
});

// DELETE /api/bookmarks/:id - Delete a bookmark
app.delete('/api/bookmarks/:id', (req, res) => {
  const { id } = req.params;
  let bookmarks = loadBookmarks();

  bookmarks = bookmarks.filter(b => b.id !== parseInt(id));
  saveBookmarks(bookmarks);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Bookmark manager is running at http://localhost:${PORT}`);
});
