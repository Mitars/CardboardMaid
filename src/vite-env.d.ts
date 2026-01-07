/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Server-side environment variables are not exposed to client
  // The BGG API token is now handled by Vercel Edge Function
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
