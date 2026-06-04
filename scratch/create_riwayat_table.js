import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        process.env[key] = val;
      }
    });
    console.log('✓ Loaded .env.local');
  }
} catch (e) {
  console.error('Error loading env:', e.message);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing VITE_SUPABASE_URL or key in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Checking if riwayat table exists...');

  // Try to insert a dummy row to check schema
  const { error: testError } = await supabase.from('riwayat').select('id').limit(1);

  if (!testError) {
    console.log('✅ riwayat table already exists!');
    return;
  }

  const errMsg = (testError.message || '').toLowerCase();
  console.log('Test error:', testError.message);

  if (errMsg.includes('pgrst205') || errMsg.includes('schema cache') || errMsg.includes('could not find')) {
    console.log('❌ riwayat table does not exist. Attempting to create via SQL...');

    // Use Supabase RPC or raw query - Supabase JS client does not support DDL
    // We need to use service role and pg REST API or try a raw query
    const createSQL = `
      CREATE TABLE IF NOT EXISTS riwayat (
        id TEXT PRIMARY KEY,
        waktu TEXT NOT NULL,
        username TEXT NOT NULL DEFAULT '',
        user_nama TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL,
        action TEXT NOT NULL,
        kategori TEXT NOT NULL,
        pesan TEXT NOT NULL,
        docid TEXT,
        puskesmas TEXT,
        createdat TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_riwayat_username ON riwayat(username);
      CREATE INDEX IF NOT EXISTS idx_riwayat_puskesmas ON riwayat(puskesmas);
    `;

    // Try the rpc method - this requires a custom function in Supabase
    // Instead we'll try using .rpc('exec_sql', { sql: ... })
    const { data, error } = await supabase.rpc('exec_sql', { sql: createSQL });
    if (error) {
      console.error('❌ Could not auto-create via RPC. You need to run this manually in Supabase SQL Editor:');
      console.log('\n=== COPY THIS SQL ===\n');
      console.log(createSQL);
      console.log('\n====================\n');
    } else {
      console.log('✅ riwayat table created successfully via RPC!', data);
    }
  }
}

main();
