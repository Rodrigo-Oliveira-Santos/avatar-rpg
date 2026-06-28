/**
 * Avatar RPG — Runtime configuration (example)
 *
 * Copy this file to `public/config.js` (gitignored) and tweak the values
 * for your local environment. When `useSupabase` is `true`, the app will
 * mirror character writes to your Supabase instance in addition to
 * localStorage.
 *
 * The defaults below match the deterministic credentials the Supabase CLI
 * boots with (`npx supabase start`). For a remote project, replace
 * `url` and `anonKey` with the values from Settings → API.
 */
window.__AVATAR_CONFIG__ = {
  useSupabase: false,
  supabase: {
    url: 'http://127.0.0.1:54321',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  },
};
