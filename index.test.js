const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('./index');

const BOOKMARKS_FILE = path.join(__dirname, 'bookmarks.json');
const TEST_BOOKMARKS = [
  {
    id: 1,
    url: 'https://example.com',
    title: 'Example',
    category: 'Learning',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    url: 'https://github.com',
    title: 'Github',
    category: 'Work',
    createdAt: '2026-01-02T00:00:00.000Z'
  }
];

beforeEach(() => {
  fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(TEST_BOOKMARKS, null, 2));
});

afterAll(() => {
  if (fs.existsSync(BOOKMARKS_FILE)) {
    fs.unlinkSync(BOOKMARKS_FILE);
  }
});

describe('GET /api/bookmarks', () => {
  test('should return all bookmarks', async () => {
    const res = await request(app).get('/api/bookmarks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(TEST_BOOKMARKS);
  });

  test('should return empty array when no bookmarks exist', async () => {
    fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify([]));
    const res = await request(app).get('/api/bookmarks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/bookmarks', () => {
  test('should add a new bookmark with valid data', async () => {
    const newBookmark = {
      url: 'https://newsite.com',
      title: 'New Site',
      category: 'Learning'
    };

    const res = await request(app)
      .post('/api/bookmarks')
      .send(newBookmark);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.bookmark).toHaveProperty('id');
    expect(res.body.bookmark.url).toBe(newBookmark.url);
    expect(res.body.bookmark.title).toBe(newBookmark.title);
    expect(res.body.bookmark.category).toBe(newBookmark.category);
    expect(res.body.bookmark).toHaveProperty('createdAt');

    // Verify it was saved
    const saved = JSON.parse(fs.readFileSync(BOOKMARKS_FILE, 'utf8'));
    expect(saved).toContainEqual(res.body.bookmark);
  });

  test('should return 400 if URL is missing', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .send({
        title: 'No URL',
        category: 'Test'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('URL, title, and category are required');
  });

  test('should return 400 if title is missing', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .send({
        url: 'https://example.com',
        category: 'Test'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('URL, title, and category are required');
  });

  test('should return 400 if category is missing', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .send({
        url: 'https://example.com',
        title: 'Example'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('URL, title, and category are required');
  });

  test('should increment bookmark ID', async () => {
    const res1 = await request(app)
      .post('/api/bookmarks')
      .send({
        url: 'https://first.com',
        title: 'First',
        category: 'Test'
      });

    const res2 = await request(app)
      .post('/api/bookmarks')
      .send({
        url: 'https://second.com',
        title: 'Second',
        category: 'Test'
      });

    expect(res2.body.bookmark.id).toBeGreaterThan(res1.body.bookmark.id);
  });
});

describe('DELETE /api/bookmarks/:id', () => {
  test('should delete a bookmark by id', async () => {
    const res = await request(app).delete(`/api/bookmarks/${TEST_BOOKMARKS[0].id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it was deleted
    const saved = JSON.parse(fs.readFileSync(BOOKMARKS_FILE, 'utf8'));
    expect(saved).not.toContainEqual(TEST_BOOKMARKS[0]);
    expect(saved.length).toBe(1);
  });

  test('should handle deleting non-existent bookmark', async () => {
    const res = await request(app).delete('/api/bookmarks/99999');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // All bookmarks should still exist
    const saved = JSON.parse(fs.readFileSync(BOOKMARKS_FILE, 'utf8'));
    expect(saved.length).toBe(TEST_BOOKMARKS.length);
  });
});

describe('GET /', () => {
  test('should serve the main page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });
});
