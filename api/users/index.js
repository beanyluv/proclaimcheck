import { prepareDb, saveDb, isUsingSupabase } from '../_db.js';
import { getSupabase } from '../supabase.js';

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      if (isUsingSupabase()) {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('createdAt', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data || []);
      } else {
        const db = await prepareDb();
        return res.status(200).json(db.data.users);
      }
    } catch (error) {
      console.error('GET /api/users error:', error.message);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { id, username, password, nama, email, role, foto } = req.body;
    if (!username || !password || !nama || !role) {
      return res.status(400).json({ error: 'Missing required user fields' });
    }

    try {
      if (isUsingSupabase()) {
        const supabase = getSupabase();
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .neq('id', id || 'null')
          .single()
          .catch(() => ({ data: null }));
        if (existing) {
          return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        const userId = id || Date.now().toString();
        const newUser = {
          id: userId,
          username,
          password,
          nama,
          email: email || '',
          role,
          foto: foto || '',
        };

        const { data, error } = await supabase
          .from('users')
          .insert([newUser]);
        if (error) throw error;
        return res.status(201).json(newUser);
      } else {
        const db = await prepareDb();
        const users = db.data.users;
        const exists = users.some((user) => user.username === username && user.id !== id);
        if (exists) {
          return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        const userId = id || Date.now().toString();
        const newUser = {
          id: userId,
          username,
          password,
          nama,
          email: email || '',
          role,
          foto: foto || '',
        };

        users.push(newUser);
        await saveDb();
        return res.status(201).json(newUser);
      }
    } catch (error) {
      console.error('POST /api/users error:', error.message);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST,OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
