import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { getSupabase, isSupabaseEnabled } from './supabase.js';

const dbFile = path.join(process.cwd(), 'server', 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

export async function prepareDb() {
  const useSupabase = isSupabaseEnabled();
  
  if (useSupabase) {
    const supabase = getSupabase();
    try {
      // For Supabase, just verify connection - return a proxy object
      return { supabase, data: null };
    } catch (err) {
      console.warn('Supabase connection failed, falling back to lowdb:', err.message);
    }
  }

  // Fallback to lowdb for local/offline mode
  await db.read();
  db.data ||= { uploads: [], users: [] };
  if (!Array.isArray(db.data.uploads)) db.data.uploads = [];
  if (!Array.isArray(db.data.users)) db.data.users = [];
  return db;
}

export async function getLocalDb() {
  await db.read();
  db.data ||= { uploads: [], users: [] };
  if (!Array.isArray(db.data.uploads)) db.data.uploads = [];
  if (!Array.isArray(db.data.users)) db.data.users = [];
  return db;
}

export async function saveDb() {
  if (isSupabaseEnabled()) {
    // Supabase auto-saves, no action needed
    return;
  }
  try {
    await db.write();
  } catch (err) {
    console.warn('Gagal menulis ke local db (mungkin read-only filesystem di serverless environment):', err.message);
  }
}

export function isUsingSupabase() {
  return isSupabaseEnabled();
}
