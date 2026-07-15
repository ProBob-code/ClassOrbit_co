export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ADMIN_EMAILS: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  ADMIN_JWT_SECRET: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_KEY_ID_LIVE: string;
  RAZORPAY_KEY_SECRET_LIVE: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  GROQ_API_KEY: string;
  // Alerting (optional — alerting no-ops if unset)
  ALERT_EMAIL?: string;
  ALERT_FROM?: string;
  ALERTS_RESEND_API_KEY?: string;
}

export type AppEnv = { Bindings: Env };
