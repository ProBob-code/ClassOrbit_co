import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kuqwqukqsgkbnhkztpyw.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Iojn3bf-uWrIwbeJcQ3KqA_5YOF2-gZ';

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
