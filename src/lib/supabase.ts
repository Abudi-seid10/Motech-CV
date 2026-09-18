import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
// Supabase renamed "anon key" to "publishable key" in newer projects.
// VITE_SUPABASE_ANON_KEY is kept as a fallback for existing deployments/env files.
const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (or the legacy VITE_SUPABASE_ANON_KEY) are not set — copy .env.example to .env and fill them in."
  );
}

export const supabase = createClient(url, anonKey);
