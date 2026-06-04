import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
try {
  const envPath = path.join(__dirname, '.env.local');
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

async function testInsert() {
  console.log('Testing INSERT into messages table...');
  const testMsg = {
    id: `msg-test-${Date.now()}`,
    from: 'Test Sender',
    to: 'Test Receiver',
    subject: 'Test Subject',
    body: 'Test Body',
    timestamp: '30 Mei 2026, 14.35',
    isRead: false,
    direction: 'sent',
    puskesmas: 'Mulia Hati 1'
  };

  const { data, error } = await supabase.from('messages').insert([testMsg]);
  if (error) {
    console.error('Database INSERT Error:', error);
    process.exit(1);
  }
  console.log('SUCCESS: Message inserted successfully!', data);
  process.exit(0);
}

testInsert();
