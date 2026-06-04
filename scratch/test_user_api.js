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

const { default: handler } = await import('../api/users/[id].js');

async function testApi() {
  console.log('Testing /api/users/[id] PUT handler...');
  
  const mockReq = {
    method: 'PUT',
    query: { id: '1' },
    body: {
      username: 'tabita',
      nama: 'Tabita Antika',
      email: 'tabita.antika@example.com',
      role: 'Administrasi Klaim',
      foto: 'data:image/jpeg;base64,mockedsmallstringfromapi'
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
    console.log('PUT Status Code:', statusCode);
    console.log('PUT Response:', responseData ? { ...responseData, foto: responseData.foto ? responseData.foto.substring(0, 50) + '...' : 'null' } : 'null');
  } catch (err) {
    console.error('Handler threw error:', err);
  }

  console.log('\nTesting /api/users/[id] GET handler...');
  const getReq = {
    method: 'GET',
    query: { id: '1' }
  };
  
  statusCode = null;
  responseData = null;

  try {
    await handler(getReq, mockRes);
    console.log('GET Status Code:', statusCode);
    console.log('GET Response:', responseData ? { ...responseData, foto: responseData.foto ? responseData.foto.substring(0, 50) + '...' : 'null' } : 'null');
  } catch (err) {
    console.error('Handler threw error:', err);
  }
  process.exit(0);
}

testApi();
