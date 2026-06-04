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

const currentUser = {
  id: '1',
  username: 'tabita',
  password: 'admin123',
  nama: 'Tabita Antika',
  email: 'tabita.antika@example.com',
  role: 'Administrasi Klaim',
};

const name = "Tabita Antika";
const userPuskesmas = null;
const userPuskesmasShort = '';

async function testMapping() {
  console.log('Fetching messages from Supabase...');
  const { data: serverMessages, error } = await supabase.from('messages').select('*');
  if (error) {
    console.error('Error fetching:', error);
    process.exit(1);
  }

  console.log('Filtering and mapping as Admin...');
  const formattedServerMsgs = serverMessages
    .filter((m) => {
      if (currentUser?.role === 'Administrasi Klaim') {
        return true;
      }
      const isFromMe = m.from === name || m.from === currentUser?.nama || (userPuskesmas && m.from === userPuskesmas);
      const isToMe = m.to === name || m.to === currentUser?.nama || (userPuskesmas && m.to === userPuskesmas);
      return isFromMe || isToMe;
    })
    .map((m) => {
      const isFromMe = m.from === name || 
                       m.from === currentUser?.nama || 
                       (currentUser?.role === 'Administrasi Klaim' && m.from === 'Administrasi Klaim') ||
                       (userPuskesmas && m.from === userPuskesmas);
      const direction = isFromMe ? 'sent' : 'inbox';
      
      return {
        id: m.id,
        from: m.from,
        to: m.to,
        subject: m.subject,
        body: m.body,
        timestamp: m.timestamp,
        isRead: m.isRead,
        direction,
        puskesmas: m.puskesmas || undefined
      };
    });

  console.log('Resulting messages in Admin inbox/sent:');
  console.log(JSON.stringify(formattedServerMsgs, null, 2));
  process.exit(0);
}

testMapping();
