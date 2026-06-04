import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log('✓ Berhasil memuat variabel lingkungan Supabase dari .env.local');
  } else {
    console.warn('⚠️ File .env.local tidak ditemukan');
  }
} catch (e) {
  console.warn('⚠️ Gagal memuat .env.local:', e.message);
}
