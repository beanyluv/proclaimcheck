import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const USE_SUPABASE = SUPABASE_URL && SUPABASE_KEY;

let supabase = null;

if (USE_SUPABASE) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function initSupabase() {
  if (!USE_SUPABASE) return null;

  try {
    // Create tables if they don't exist
    const { data, error } = await supabase.rpc('check_tables_exist').catch(() => ({}));
    if (!error) return supabase;

    // Initialize schema
    const schema = `
      CREATE TABLE IF NOT EXISTS uploads (
        id TEXT PRIMARY KEY,
        fileName TEXT,
        fileType TEXT,
        fileData TEXT,
        videoLink TEXT,
        puskesmas TEXT NOT NULL,
        month TEXT NOT NULL,
        year TEXT NOT NULL,
        documentType TEXT NOT NULL,
        uploadedAt TEXT NOT NULL,
        uploadedBy TEXT,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nama TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL,
        foto TEXT,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      );
    `;

    // Note: Schema should be created manually in Supabase dashboard or via migrations
    // This is just a reference for manual setup
    return supabase;
  } catch (err) {
    console.error('Supabase init error:', err);
    return supabase;
  }
}

export function getSupabase() {
  return supabase;
}

export function isSupabaseEnabled() {
  return USE_SUPABASE && supabase !== null;
}
