import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables FIRST
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

// Now dynamically import the handler
const { default: handler } = await import('../api/messages/index.js');

async function testApi() {
  console.log('Testing /api/messages handler (POST)...');
  
  const mockReq = {
    method: 'POST',
    body: {
      id: `msg-api-test-real-${Date.now()}`,
      from: 'Kanaya Talitakamta',
      to: 'Administrasi Klaim',
      subject: 'Halo dari test API nyata',
      body: 'Ini adalah body pesan test nyata.',
      timestamp: '30 Mei 2026, 14.40',
      isRead: false,
      direction: 'sent',
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
    console.log('Status Code:', statusCode);
    console.log('Response:', responseData);
  } catch (err) {
    console.error('Handler threw error:', err);
  }
}

testApi();
