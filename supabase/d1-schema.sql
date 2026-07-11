-- ClassOrbit D1 Schema
-- Run: wrangler d1 execute classorbit-db --file=supabase/d1-schema.sql

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sticker TEXT NOT NULL DEFAULT '📚',
  color TEXT NOT NULL DEFAULT 'bg-primary',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'prompt',
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);

CREATE TABLE IF NOT EXISTS saved_prompts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_type TEXT,
  grade TEXT,
  subject TEXT,
  topic TEXT,
  tools TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  prompt_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);

CREATE TABLE IF NOT EXISTS custom_tools (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_url TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'text',
  is_free INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_tools_user_id ON custom_tools(user_id);

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prompt_shares (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  tool_name TEXT NOT NULL,
  tool_url TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  topic TEXT,
  content_type TEXT,
  grade TEXT,
  subject TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  plan_type TEXT DEFAULT 'free',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  subscription_status TEXT DEFAULT 'active',
  plan_expires_at DATETIME,
  has_seeded_workspace INTEGER DEFAULT 0,
  email TEXT,
  name TEXT,
  is_blocked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prompt_usage (
  user_id TEXT,
  month TEXT,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

CREATE TABLE IF NOT EXISTS blogs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT,
  cover_image_url TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Blog images uploaded from the admin panel (cover + body images). Bytes
-- live in R2 (binding IMAGES, key = r2_key); this row is just metadata,
-- served via GET /api/images/:id. Uploads are cropped/compressed
-- client-side before hitting the worker.
CREATE TABLE IF NOT EXISTS blog_images (
  id TEXT PRIMARY KEY,
  filename TEXT,
  mime TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Maps a Razorpay order to a user/plan so the webhook can grant Pro server-side.
CREATE TABLE IF NOT EXISTS payment_orders (
  order_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount INTEGER,
  status TEXT NOT NULL DEFAULT 'created',
  razorpay_payment_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);

-- Throttle table for admin alert emails.
CREATE TABLE IF NOT EXISTS alert_log (
  alert_key TEXT PRIMARY KEY,
  last_sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
