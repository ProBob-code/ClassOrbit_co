export interface Env {
  DB: D1Database;
  ADMIN_EMAILS: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  ADMIN_JWT_SECRET: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  GROQ_API_KEY: string;
}

export type AppEnv = { Bindings: Env };
