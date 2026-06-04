import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  }
} catch (e) {
  console.error('Error loading env:', e.message);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Supabase URL or Key not found in .env.local!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
  console.log('Querying schema for table "messages"...');
  // We can query the information_schema via RPC or raw query. Since Supabase client cannot run raw sql,
  // we can do a SELECT on a non-existent column or just try to get a single row and inspect keys,
  // or we can select from information_schema via PostgREST if views are exposed.
  // Actually, we can just fetch a single message and look at the exact case of all keys in JavaScript.
  const { data, error } = await supabase.from('messages').select('*').limit(1);
  if (error) {
    console.error('Error fetching message:', error.message);
    process.exit(1);
  }
  if (data && data.length > 0) {
    console.log('Keys of retrieved message:', Object.keys(data[0]));
    console.log('Sample message:', data[0]);
  } else {
    console.log('No messages found to inspect keys.');
  }
  process.exit(0);
}

checkSchema();
