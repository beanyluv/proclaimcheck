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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.VITE_SUPABASE_SERVICE_ROLE ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', SUPABASE_URL ? '✅ Ada' : '❌ TIDAK ADA');
console.log('Supabase Key:', SUPABASE_KEY ? '✅ Ada (' + SUPABASE_KEY.substring(0, 20) + '...)' : '❌ TIDAK ADA');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\n❌ STOP: Env variables tidak ditemukan di .env.local!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRiwayat() {
  console.log('\n--- [1] Mengecek tabel riwayat di Supabase ---');
  const { data, error } = await supabase
    .from('riwayat')
    .select('*')
    .order('createdat', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ ERROR saat SELECT riwayat:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    return;
  }

  console.log(`✅ Tabel riwayat OK. Total item terbaru: ${data.length}`);
  if (data.length > 0) {
    console.log('\nContoh item terbaru:');
    data.slice(0, 3).forEach((item, i) => {
      console.log(`  [${i+1}]`, JSON.stringify(item, null, 4));
    });
  } else {
    console.log('⚠️  Tabel KOSONG — belum ada data riwayat tersimpan di Supabase.');
  }

  console.log('\n--- [2] Test INSERT langsung ke Supabase ---');
  const testEntry = {
    id: `check-test-${Date.now()}`,
    waktu: '01 Juni 2026, 12.00 WIB',
    username: 'test-user',
    user_nama: 'Test User',
    role: 'Petugas Puskesmas',
    action: 'Unggah',
    kategori: 'Unggah Berkas',
    pesan: 'Test insert langsung ke Supabase',
    docid: null,
    puskesmas: 'Mulia Hati 1'
  };

  const { error: insertError } = await supabase.from('riwayat').insert([testEntry]);
  if (insertError) {
    console.error('❌ INSERT GAGAL:', insertError.message);
    console.error('   Code:', insertError.code);
    console.error('   Details:', insertError.details);
    console.error('   Hint:', insertError.hint);
  } else {
    console.log('✅ INSERT berhasil! Data masuk ke Supabase.');
  }
}

checkRiwayat().then(() => process.exit(0)).catch(e => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
