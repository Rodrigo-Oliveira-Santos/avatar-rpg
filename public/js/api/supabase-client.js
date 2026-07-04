/**
 * Lazy Supabase client.
 *
 * The supabase-js module is loaded on demand from a CDN the first time
 * someone asks for a client. This keeps the static `public/` build
 * dependency-free in localStorage mode and avoids paying the bundle cost
 * for users that never opt into the Supabase persistence path.
 *
 * We use jsdelivr.net (not esm.sh) because jsdelivr sends
 * `Cross-Origin-Resource-Policy: cross-origin` on every response, which
 * is required when the host page enables Cross-Origin Isolation
 * (`Cross-Origin-Embedder-Policy: require-corp` — see netlify.toml /
 * public/serve.json) for the Godot map iframe in the Hub.
 */

import { getConfig, isSupabaseEnabled } from './config.js';

const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

let clientPromise = null;

async function loadSupabaseModule() {
  return import(/* @vite-ignore */ SUPABASE_CDN);
}

export async function getSupabaseClient() {
  if (!isSupabaseEnabled()) {
    throw new Error('Supabase is disabled — set useSupabase=true in public/config.js');
  }

  if (!clientPromise) {
    clientPromise = (async () => {
      const config = getConfig();
      const { createClient } = await loadSupabaseModule();
      return createClient(config.supabase.url, config.supabase.anonKey, {
        auth: { persistSession: false },
      });
    })().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }

  return clientPromise;
}
