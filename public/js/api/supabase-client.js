/**
 * Lazy Supabase client.
 *
 * The supabase-js module is loaded on demand from a CDN (esm.sh) the first
 * time someone asks for a client. This keeps the static `public/` build
 * dependency-free in localStorage mode and avoids paying the bundle cost
 * for users that never opt into the Supabase persistence path.
 */

import { getConfig, isSupabaseEnabled } from './config.js';

const SUPABASE_CDN = 'https://esm.sh/@supabase/supabase-js@2';

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
