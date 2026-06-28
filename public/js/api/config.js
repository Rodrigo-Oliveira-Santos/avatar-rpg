/**
 * Runtime configuration resolver.
 *
 * Reads `window.__AVATAR_CONFIG__` if a `public/config.js` file is loaded
 * before `main.js`. Falls back to safe defaults (Supabase off) so the app
 * keeps working in pure localStorage mode without extra setup.
 *
 * The query-string `?supabase=1` flips on Supabase mode at runtime, which
 * is handy when you want to A/B test the persistence layer without editing
 * a file.
 */

const DEFAULTS = Object.freeze({
  useSupabase: false,
  supabase: {
    url: 'http://127.0.0.1:54321',
    anonKey: '',
  },
});

function readWindowConfig() {
  if (typeof window === 'undefined') return null;
  const value = window.__AVATAR_CONFIG__;
  return value && typeof value === 'object' ? value : null;
}

function readQueryOverride() {
  if (typeof window === 'undefined' || !window.location?.search) return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('supabase')) return null;
  const value = params.get('supabase');
  return value === '1' || value === 'true';
}

let cached = null;

export function getConfig() {
  if (cached) return cached;

  const fromWindow = readWindowConfig() || {};
  const supabaseSection = { ...DEFAULTS.supabase, ...(fromWindow.supabase || {}) };
  const queryOverride = readQueryOverride();

  cached = Object.freeze({
    ...DEFAULTS,
    ...fromWindow,
    supabase: Object.freeze(supabaseSection),
    useSupabase: queryOverride ?? Boolean(fromWindow.useSupabase),
  });

  return cached;
}

export function isSupabaseEnabled() {
  const config = getConfig();
  return Boolean(config.useSupabase && config.supabase.url && config.supabase.anonKey);
}
