-- Migration 002: system_tools table
-- Run: wrangler d1 execute classorbit-db --file=supabase/d1-migration-002-tools.sql --remote

CREATE TABLE IF NOT EXISTS system_tools (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  tool_url TEXT NOT NULL,
  tool_logo TEXT,
  category TEXT NOT NULL DEFAULT 'text',
  supported_outputs TEXT NOT NULL DEFAULT '[]',
  description TEXT,
  is_free INTEGER DEFAULT 0,
  pricing_info TEXT,
  active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 0,
  new_until DATETIME,
  walkthrough_steps TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_system_tools_active ON system_tools(active, sort_order);

-- Seed: default tools (INSERT OR IGNORE so re-running is safe)
INSERT OR IGNORE INTO system_tools
  (id, tool_name, tool_url, category, supported_outputs, description, is_free, pricing_info, active, sort_order)
VALUES
  ('chatgpt',    'ChatGPT',       'https://chat.openai.com',          'text',         '["quiz","lesson_plan","question_paper","worksheet","story","homework","flashcards","debate","rubric","notes","video_script"]', 'Best for text-heavy lesson plans and complex quizzes.',                     0, 'Free tier, Plus ₹1,650/mo',  1, 1),
  ('claude',     'Claude',        'https://claude.ai',                'text',         '["quiz","lesson_plan","question_paper","worksheet","story","homework","flashcards","debate","rubric","notes","video_script"]', 'Best for creative writing and detailed storytelling resources.',             0, 'Free tier, Pro ₹1,650/mo',   1, 2),
  ('canva',      'Canva',         'https://www.canva.com',            'visual',       '["ppt","worksheet","flashcards","classroom_activity"]',                                                                        'Best for presentations and visual classroom posters.',                      1, 'Free, Pro ₹3,999/yr',        1, 3),
  ('gamma',      'Gamma',         'https://gamma.app',                'presentation', '["ppt","lesson_plan","notes"]',                                                                                               'AI-powered presentations with beautiful slide decks.',                      1, 'Free tier available',        1, 4),
  ('notebooklm', 'NotebookLM',    'https://notebooklm.google.com',   'research',     '["notes","lesson_plan","quiz"]',                                                                                              'Research and document analysis with source grounding.',                     1, 'Free with Google account',   1, 5),
  ('suno',       'Suno',          'https://suno.com',                 'audio',        '["classroom_activity","interactive_game"]',                                                                                   'Create educational songs and audio content.',                               0, 'Free tier, Pro ₹830/mo',     1, 6),
  ('elevenlabs', 'ElevenLabs',    'https://elevenlabs.io',            'audio',        '["video_script","story"]',                                                                                                   'Professional AI voice generation for narration.',                           0, 'Free tier, Starter ₹415/mo', 1, 7),
  ('ideogram',   'Ideogram',      'https://ideogram.ai',              'image',        '["worksheet","flashcards","ppt","classroom_activity"]',                                                                      'Generate educational illustrations and diagrams.',                          1, 'Free tier available',        1, 8);
