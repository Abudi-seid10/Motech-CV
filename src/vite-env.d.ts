/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /** Current Supabase naming ("publishable key"). Preferred over VITE_SUPABASE_ANON_KEY. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Legacy Supabase naming ("anon key") — still supported as a fallback. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PROFILE_SLUG?: string;

  /** Google Gemini — https://aistudio.google.com/apikey */
  readonly VITE_GEMINI_API_KEY?: string;

  /** OpenAI / ChatGPT — https://platform.openai.com/api-keys */
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_MODEL?: string;

  /** Ollama — local model server, no API key needed */
  readonly VITE_OLLAMA_BASE_URL?: string;
  readonly VITE_OLLAMA_MODEL?: string;

  /** OpenRouter — https://openrouter.ai/keys */
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_OPENROUTER_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
