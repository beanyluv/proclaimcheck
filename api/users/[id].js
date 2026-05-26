import { prepareDb, saveDb, isUsingSupabase } from '../_db.js';
import { getSupabase } from '../supabase.js';

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (isUsingSupabase()) {
      const supabase = getSupabase();

      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', req.query.id)
          .single();
        if (error || !data) {
          return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(data);
      }

      if (req.method === 'PUT') {
        const { username, password, nama, email, role, foto } = req.body;
        const { data: existing } = await supabase
          .from('users')
          .select('*')
          .eq('id', req.query.id)
          .single()
          .catch(() => ({ data: null }));
        if (!existing) {
          return res.status(404).json({ error: 'User not found' });
        }

        const { data: duplicate } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .neq('id', req.query.id)
          .single()
          .catch(() => ({ data: null }));
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
        };

        const { data, error } = await supabase
          .from('users')
          .update(updated)
          .eq('id', req.query.id);
        if (error) throw error;
        return res.status(200).json({ ...existing, ...updated });
      }

      if (req.method === 'DELETE') {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', req.query.id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }
    } else {
      // Fallback to lowdb
      const db = await prepareDb();
      const users = db.data.users;
      const userIndex = users.findIndex((item) => item.id === req.query.id);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (req.method === 'GET') {
        return res.status(200).json(users[userIndex]);
      }

      if (req.method === 'PUT') {
        const { username, password, nama, email, role, foto } = req.body;
        const exists = users.some((user) => user.username === username && user.id !== req.query.id);
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

        await saveDb();
        return res.status(200).json(users[userIndex]);
      }

      if (req.method === 'DELETE') {
        users.splice(userIndex, 1);
        await saveDb();
        return res.status(200).json({ success: true });
      }
    }
  } catch (error) {
    console.error(`${req.method} /api/users/:id error:`, error.message);
    return res.status(500).json({ error: error.message || 'Server error' });
  }

  res.setHeader('Allow', 'GET,PUT,DELETE,OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
