export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  AHASEND_API_KEY: string;
  AHASEND_ACCOUNT_ID: string;
  OPENWEATHER_API_KEY: string;
  FRONTEND_URL: string;
  FROM_EMAIL: string;
}
