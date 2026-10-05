/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /** Current Supabase naming ("publishable key"). Preferred over VITE_SUPABASE_ANON_KEY. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Legacy Supabase naming ("anon key") — still supported as a fallback. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PROFILE_SLUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
