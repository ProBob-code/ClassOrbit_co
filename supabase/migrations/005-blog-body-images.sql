-- Blog images uploaded from the admin panel (cover + body images).
-- Bytes live in R2 (binding IMAGES); this table is just metadata, served
-- via GET /api/images/:id with immutable cache headers. Uploads are
-- cropped/compressed client-side before hitting the worker.
CREATE TABLE IF NOT EXISTS blog_images (
  id TEXT PRIMARY KEY,
  filename TEXT,
  mime TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
