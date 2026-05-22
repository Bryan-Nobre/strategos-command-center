/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Opcional: mesmo valor do secret SIGNUP_FUNCTION_SECRET na Edge Function */
  readonly VITE_SIGNUP_FUNCTION_SECRET?: string;
  readonly VITE_PLATFORM_CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
