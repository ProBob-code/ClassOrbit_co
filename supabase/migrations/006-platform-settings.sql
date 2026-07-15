CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO platform_settings (key, value) VALUES ('payment_gateway_mode', 'test');
