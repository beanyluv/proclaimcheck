import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

const defaultUsers = [
  {
    id: '1',
    username: 'tabita',
    password: 'admin123',
    nama: 'Tabita Antika',
    email: 'tabita.antika@example.com',
    role: 'Administrasi Klaim',
  },
  {
    id: '2',
    username: 'kanaya',
    password: 'dokter123',
    nama: 'Kanaya Talita',
    email: 'kanaya.talita@example.com',
    role: 'Dokter',
  },
  {
    id: '3',
    username: 'ferdyana',
    password: 'dokter123',
    nama: 'Ferdyana',
    email: 'ferdyana@example.com',
    role: 'Dokter',
  },
];

await db.read();
db.data ||= { uploads: [], users: [] };
if (!Array.isArray(db.data.users) || db.data.users.length === 0) {
  db.data.users = defaultUsers;
  await db.write();
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '100mb' }));

const staticDir = path.join(__dirname, '..', 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(staticDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

const getServerUploads = async () => {
  await db.read();
  db.data ||= { uploads: [], users: defaultUsers };
  return db.data.uploads;
};

const saveServerUploads = async (uploads) => {
  await db.read();
  db.data ||= { uploads: [], users: defaultUsers };
  db.data.uploads = uploads;
  await db.write();
};

const getServerUsers = async () => {
  await db.read();
  db.data ||= { uploads: [], users: defaultUsers };
  return db.data.users;
};

const saveServerUsers = async (users) => {
  await db.read();
  db.data ||= { uploads: [], users: defaultUsers };
  db.data.users = users;
  await db.write();
};

app.post('/api/uploads', async (req, res) => {
  const {
    id,
    fileName,
    fileType,
    fileData,
    videoLink,
    puskesmas,
    month,
    year,
    documentType,
    uploadedAt,
    uploadedBy,
  } = req.body;

  if (!id || !puskesmas || !month || !year || !documentType || !uploadedAt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const uploads = await getServerUploads();
  const existing = uploads.find((item) => item.id === id);
  const uploadEntry = {
    id,
    fileName: fileName || null,
    fileType: fileType || null,
    fileData: fileData || null,
    videoLink: videoLink || null,
    puskesmas,
    month,
    year,
    documentType,
    uploadedAt,
    uploadedBy: uploadedBy || null,
    createdAt: new Date().toISOString(),
  };

  if (existing) {
    Object.assign(existing, uploadEntry);
  } else {
    uploads.unshift(uploadEntry);
  }

  await saveServerUploads(uploads);
  return res.status(201).json({ success: true });
});

app.get('/api/uploads', async (req, res) => {
  const uploads = await getServerUploads();
  res.json(uploads);
});

app.get('/api/uploads/:id', async (req, res) => {
  const uploads = await getServerUploads();
  const upload = uploads.find((item) => item.id === req.params.id);
  if (!upload) {
    return res.status(404).json({ error: 'Upload not found' });
  }
  res.json(upload);
});

app.get('/api/users', async (req, res) => {
  const users = await getServerUsers();
  res.json(users);
});

app.get('/api/users/:id', async (req, res) => {
  const users = await getServerUsers();
  const user = users.find((item) => item.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/api/users', async (req, res) => {
  const { id, username, password, nama, email, role, foto } = req.body;
  if (!username || !password || !nama || !role) {
    return res.status(400).json({ error: 'Missing required user fields' });
  }

  const users = await getServerUsers();
  const exists = users.some((user) => user.username === username && user.id !== id);
  if (exists) {
    return res.status(400).json({ error: 'Username sudah digunakan' });
  }

  const userId = id || Date.now().toString();
  const newUser = { id: userId, username, password, nama, email: email || '', role, foto: foto || '' };
  users.push(newUser);
  await saveServerUsers(users);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', async (req, res) => {
  const { username, password, nama, email, role, foto } = req.body;
  const users = await getServerUsers();
  const userIndex = users.findIndex((item) => item.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const exists = users.some((user) => user.username === username && user.id !== req.params.id);
  if (exists) {
    return res.status(400).json({ error: 'Username sudah digunakan' });
  }

  users[userIndex] = {
    ...users[userIndex],
    username: username ?? users[userIndex].username,
    password: password ? password : users[userIndex].password,
    nama: nama ?? users[userIndex].nama,
    email: email ?? users[userIndex].email,
    role: role ?? users[userIndex].role,
    foto: foto ?? users[userIndex].foto,
  };
  await saveServerUsers(users);
  res.json(users[userIndex]);
});

app.delete('/api/users/:id', async (req, res) => {
  const users = await getServerUsers();
  const updated = users.filter((item) => item.id !== req.params.id);
  if (updated.length === users.length) {
    return res.status(404).json({ error: 'User not found' });
  }
  await saveServerUsers(updated);
  res.json({ success: true });
});

const port = Number(process.env.PORT || 4000);
const maxPortTries = 5;

const startServer = (currentPort, attempt = 1) => {
  const server = app.listen(currentPort, () => {
    console.log(`Upload server listening on http://localhost:${currentPort}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < maxPortTries) {
      const nextPort = currentPort + 1;
      console.warn(`Port ${currentPort} sudah dipakai. Mencoba port ${nextPort}...`);
      startServer(nextPort, attempt + 1);
    } else {
      console.error('Gagal memulai server:', err.message);
      process.exit(1);
    }
  });
};

startServer(port);
