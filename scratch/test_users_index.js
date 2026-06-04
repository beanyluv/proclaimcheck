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

const { default: handler } = await import('../api/users/index.js');

async function testApi() {
  console.log('Testing /api/users handler (GET)...');
  
  const mockReq = {
    method: 'GET'
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
    console.log('GET Status Code:', statusCode);
    if (responseData) {
      responseData.forEach(u => {
        console.log(`User: ${u.username}, Nama: ${u.nama}, Foto preview: ${u.foto ? u.foto.substring(0, 50) + '...' : 'null'}`);
      });
    } else {
      console.log('Response is null/empty');
    }
  } catch (err) {
    console.error('Handler threw error:', err);
  }
  process.exit(0);
}

testApi();
