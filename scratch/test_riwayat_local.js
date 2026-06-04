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

const { default: handler } = await import('../api/riwayat/index.js');

async function testApi() {
  console.log('Testing /api/riwayat handler (POST)...');
  
  const mockReq = {
    method: 'POST',
    body: {
      id: `riwayat-test-${Date.now()}`,
      waktu: '01 Juni 2026, 10.45 WIB',
      username: 'petugas.muliahati1',
      user: 'Petugas Mulia Hati 1',
      role: 'Petugas Puskesmas',
      action: 'Upload',
      kategori: 'Unggah Berkas',
      pesan: 'Mengunggah Laporan kegiatan edukasi/penyuluhan & senam Prolanis untuk Mulia Hati 1, Februari 2025',
      docId: 'doc12345',
      puskesmas: 'Mulia Hati 1'
    }
  };

  let statusCode = null;
  let responseData = null;

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    setHeader() {},
    end() {}
  };

  try {
    await handler(mockReq, mockRes);
    console.log('POST Status Code:', statusCode);
    console.log('POST Response:', responseData);
  } catch (err) {
    console.error('POST Handler threw error:', err);
  }

  console.log('Testing /api/riwayat handler (GET)...');
  const mockReqGet = { method: 'GET' };
  try {
    await handler(mockReqGet, mockRes);
    console.log('GET Status Code:', statusCode);
    console.log('GET Response length:', Array.isArray(responseData) ? responseData.length : 'Not array');
    if (Array.isArray(responseData) && responseData.length > 0) {
      console.log('Sample GET item:', responseData[0]);
    }
  } catch (err) {
    console.error('GET Handler threw error:', err);
  }
}

testApi();
