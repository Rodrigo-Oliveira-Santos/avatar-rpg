/**
 * Notifications API
 *
 * When Supabase is enabled, reads/writes the `notifications` table for the
 * current user. Otherwise returns empty results (the UI handles that case).
 */

import { isSupabaseEnabled } from './config.js';
import { getSupabaseClient } from './supabase-client.js';

function readCurrentUsername() {
  try {
    const stored = localStorage.getItem('avatar_rpg_user');
    if (stored) return JSON.parse(stored).username;
  } catch {}
  return null;
}

async function resolveUserId(client, username) {
  const { data, error } = await client
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export async function list() {
  if (!isSupabaseEnabled()) return [];
  const username = readCurrentUsername();
  if (!username) return [];
  try {
    const client = await getSupabaseClient();
    const userId = await resolveUserId(client, username);
    if (!userId) return [];
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[notifications.list] Supabase fetch failed', err);
    return [];
  }
}

export async function markRead(id) {
  if (!isSupabaseEnabled()) return { id, is_read: true };
  try {
    const client = await getSupabaseClient();
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
    return { id, is_read: true };
  } catch (err) {
    console.warn('[notifications.markRead] Supabase update failed', err);
    return { id, is_read: false, error: err.message };
  }
}
