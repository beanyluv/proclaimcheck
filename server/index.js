import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSupabase, isSupabaseEnabled } from '../api/supabase.js';
import { mapUploadToDb, mapUploadFromDb, mapMessageToDb, mapMessageFromDb, mapRiwayatToDb, mapRiwayatFromDb } from '../api/_db.js';

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
    status,
    keterangan,
    analysis,
    lastModified,
    modifiedBy,
  } = req.body;

  if (!id || !puskesmas || !month || !year || !documentType || !uploadedAt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

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
    status: status || null,
    keterangan: keterangan || null,
    analysis: analysis || null,
    lastModified: lastModified || null,
    modifiedBy: modifiedBy || null,
  };

  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const dbEntry = mapUploadToDb(uploadEntry);
      const { data: existing, error: findError } = await supabase
        .from('uploads')
        .select('id')
        .eq('id', id)
        .maybeSingle();
      if (findError) throw findError;

      if (existing) {
        const { error: updateError } = await supabase.from('uploads').update(dbEntry).eq('id', id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('uploads').insert([dbEntry]);
        if (insertError) throw insertError;
      }
    } else {
      const uploads = await getServerUploads();
      const existing = uploads.find((item) => item.id === id);
      if (existing) {
        Object.assign(existing, uploadEntry);
      } else {
        uploads.unshift({ ...uploadEntry, createdAt: new Date().toISOString() });
      }
      await saveServerUploads(uploads);
    }
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('POST /api/uploads error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/uploads', async (req, res) => {
  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .order('createdat', { ascending: false });
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase.from('uploads').select('*');
        if (fallbackError) throw fallbackError;
        if (fallbackData) return res.json(fallbackData.map(mapUploadFromDb));
      } else if (data) {
        return res.json(data.map(mapUploadFromDb));
      }
    }
    const uploads = await getServerUploads();
    res.json(uploads);
  } catch (err) {
    console.error('GET /api/uploads error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/uploads/:id', async (req, res) => {
  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('uploads').select('*').eq('id', req.params.id).maybeSingle();
      if (error) throw error;
      if (data) return res.json(mapUploadFromDb(data));
      return res.status(404).json({ error: 'Upload not found' });
    }
    const uploads = await getServerUploads();
    const upload = uploads.find((item) => item.id === req.params.id);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    res.json(upload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      let { data, error } = await supabase.from('users').select('*').order('createdat', { ascending: false });
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase.from('users').select('*');
        if (fallbackError) throw fallbackError;
        data = fallbackData;
      }
      if (data && data.length > 0) {
        return res.json(data);
      }
      const { error: insertError } = await supabase.from('users').insert(defaultUsers);
      if (insertError) throw insertError;
      return res.json(defaultUsers);
    }
    const users = await getServerUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).maybeSingle();
      if (error) throw error;
      if (data) return res.json(data);
      return res.status(404).json({ error: 'User not found' });
    }
    const users = await getServerUsers();
    const user = users.find((item) => item.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { id, username, password, nama, email, role, foto, puskesmas } = req.body;
  if (!username || !password || !nama || !role) {
    return res.status(400).json({ error: 'Missing required user fields' });
  }

  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { data: exists, error: checkError } = await supabase.from('users').select('id').eq('username', username).neq('id', id || 'null').maybeSingle();
      if (checkError) throw checkError;
      if (exists) {
        return res.status(400).json({ error: 'Username sudah digunakan' });
      }

      const userId = id || Date.now().toString();
      const newUser = { id: userId, username, password, nama, email: email || '', role, foto: foto || '', puskesmas: puskesmas || '' };
      const { error: insertError } = await supabase.from('users').insert([newUser]);
      if (insertError) throw insertError;
      return res.status(201).json(newUser);
    } else {
      const users = await getServerUsers();
      const exists = users.some((user) => user.username === username && user.id !== id);
      if (exists) {
        return res.status(400).json({ error: 'Username sudah digunakan' });
      }

      const userId = id || Date.now().toString();
      const newUser = { id: userId, username, password, nama, email: email || '', role, foto: foto || '', puskesmas: puskesmas || '' };
      users.push(newUser);
      await saveServerUsers(users);
      res.status(201).json(newUser);
    }
  } catch (err) {
    console.error('POST /api/users error details:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { username, password, nama, email, role, foto, puskesmas } = req.body;

  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { data: existing, error: findError } = await supabase.from('users').select('*').eq('id', req.params.id).maybeSingle();
      if (findError) throw findError;
      if (!existing) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { data: duplicate, error: dupError } = await supabase.from('users').select('id').eq('username', username).neq('id', req.params.id).maybeSingle();
      if (dupError) throw dupError;
      if (duplicate) {
        return res.status(400).json({ error: 'Username sudah digunakan' });
      }

      const updated = {
        username: username ?? existing.username,
        password: password ? password : existing.password,
        nama: nama ?? existing.nama,
        email: email ?? existing.email,
        role: role ?? existing.role,
        foto: foto ?? existing.foto,
        puskesmas: puskesmas ?? existing.puskesmas,
      };

      const { error: updateError } = await supabase.from('users').update(updated).eq('id', req.params.id);
      if (updateError) throw updateError;
      return res.json({ ...existing, ...updated });
    } else {
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
        puskesmas: puskesmas ?? users[userIndex].puskesmas,
      };
      await saveServerUsers(users);
      res.json(users[userIndex]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { error } = await supabase.from('users').delete().eq('id', req.params.id);
      if (error) throw error;
      return res.json({ success: true });
    } else {
      const users = await getServerUsers();
      const updated = users.filter((item) => item.id !== req.params.id);
      if (updated.length === users.length) {
        return res.status(404).json({ error: 'User not found' });
      }
      await saveServerUsers(updated);
      return res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== MESSAGING API =====
const getServerMessages = async () => {
  await db.read();
  db.data ||= { uploads: [], users: [], messages: [] };
  db.data.messages ||= [];
  return db.data.messages;
};

const saveServerMessages = async (messages) => {
  await db.read();
  db.data ||= { uploads: [], users: [], messages: [] };
  db.data.messages = messages;
  await db.write();
};

app.get('/api/messages', async (req, res) => {
  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('messages').select('*').order('id', { ascending: false });
      if (error) throw error;
      if (data) return res.json(data.map(mapMessageFromDb));
    }
    const messages = await getServerMessages();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  const { id, from, to, subject, body, timestamp, isRead, direction, puskesmas } = req.body;
  if (!from || !to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required message fields' });
  }

  const newMessage = {
    id: id || `msg-${Date.now()}`,
    from,
    to,
    subject,
    body,
    timestamp: timestamp || new Date().toLocaleString('id-ID'),
    isRead: isRead !== undefined ? isRead : false,
    direction: direction || 'inbox',
    puskesmas: puskesmas || null
  };

  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const dbEntry = mapMessageToDb(newMessage);
      const { error } = await supabase.from('messages').insert([dbEntry]);
      if (error) throw error;
    } else {
      const messages = await getServerMessages();
      messages.push(newMessage);
      await saveServerMessages(messages);
    }
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== RIWAYAT HISTORY API =====
const getServerRiwayat = async () => {
  await db.read();
  db.data ||= { uploads: [], users: defaultUsers, riwayat: [] };
  db.data.riwayat ||= [];
  return db.data.riwayat;
};

const saveServerRiwayat = async (riwayat) => {
  await db.read();
  db.data ||= { uploads: [], users: defaultUsers, riwayat: [] };
  db.data.riwayat = riwayat;
  await db.write();
};

app.put('/api/messages', async (req, res) => {
  const { id, deletedByUsername, isRead } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { data: currentMsg, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!currentMsg) return res.status(404).json({ error: 'Message not found' });

      const dbMsg = mapMessageFromDb(currentMsg);

      if (deletedByUsername) {
        const parseDeletedUsers = (b) => {
          const match = (b || '').match(/<!--deleted_by:(.*?)-->/);
          return match ? match[1].split(',').filter(Boolean) : [];
        };
        const users = parseDeletedUsers(dbMsg.body);
        if (!users.includes(deletedByUsername)) {
          users.push(deletedByUsername);
          const cleanBody = (dbMsg.body || '').replace(/<!--deleted_by:(.*?)-->/, '').trim();
          dbMsg.body = `${cleanBody}\n\n<!--deleted_by:${users.join(',')}-->`;
        }
      }

      if (isRead !== undefined) {
        dbMsg.isRead = isRead;
      }

      const dbEntry = mapMessageToDb(dbMsg);
      const { error: updateError } = await supabase
        .from('messages')
        .update(dbEntry)
        .eq('id', id);

      if (updateError) throw updateError;
      return res.json(dbMsg);
    } else {
      const messages = await getServerMessages();
      const index = messages.findIndex(m => m.id === id);
      if (index !== -1) {
        const msg = messages[index];

        if (deletedByUsername) {
          const parseDeletedUsers = (b) => {
            const match = (b || '').match(/<!--deleted_by:(.*?)-->/);
            return match ? match[1].split(',').filter(Boolean) : [];
          };
          const users = parseDeletedUsers(msg.body);
          if (!users.includes(deletedByUsername)) {
            users.push(deletedByUsername);
            const cleanBody = (msg.body || '').replace(/<!--deleted_by:(.*?)-->/, '').trim();
            msg.body = `${cleanBody}\n\n<!--deleted_by:${users.join(',')}-->`;
          }
        }

        if (isRead !== undefined) {
          msg.isRead = isRead;
        }

        await saveServerMessages(messages);
        return res.json(msg);
      }
      return res.status(404).json({ error: 'Message not found' });
    }
  } catch (err) {
    console.error('PUT /api/messages error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/riwayat', async (req, res) => {
  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('riwayat')
        .select('*')
        .order('createdat', { ascending: false });
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase.from('riwayat').select('*');
        if (fallbackError) throw fallbackError;
        if (fallbackData) return res.json(fallbackData.map(mapRiwayatFromDb));
      } else if (data) {
        return res.json(data.map(mapRiwayatFromDb));
      }
    }
    const riwayat = await getServerRiwayat();
    res.json(riwayat);
  } catch (err) {
    console.error('GET /api/riwayat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/riwayat', async (req, res) => {
  const { id, waktu, username, user, role, action, kategori, pesan, docId, puskesmas } = req.body;
  if (!id || !waktu || !role || !action || !kategori || !pesan) {
    return res.status(400).json({ error: 'Missing required riwayat fields' });
  }

  const riwayatEntry = {
    id,
    waktu,
    username: username || '',
    user: user || '',
    role,
    action,
    kategori,
    pesan,
    docId: docId || null,
    puskesmas: puskesmas || null
  };

  try {
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const dbEntry = mapRiwayatToDb(riwayatEntry);
      const { error } = await supabase.from('riwayat').insert([dbEntry]);
      if (error) throw error;
    } else {
      const riwayat = await getServerRiwayat();
      riwayat.unshift(riwayatEntry);
      await saveServerRiwayat(riwayat);
    }
    res.status(201).json(riwayatEntry);
  } catch (err) {
    console.error('POST /api/riwayat error:', err.message);
    res.status(500).json({ error: err.message });
  }
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
