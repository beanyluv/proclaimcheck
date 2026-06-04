import { prepareDb, saveDb, isUsingSupabase } from '../_db.js';
import { getSupabase } from '../supabase.js';
import bcrypt from 'bcryptjs';

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

        let { data, error } = await supabase
          .from('users')
          .select('*')
          .order('createdat', { ascending: false });

        if (error) {
          const msg = (error.message || '').toLowerCase();
          if (msg.includes('createdat') || msg.includes('column') || msg.includes('does not exist')) {
            const fallback = await supabase.from('users').select('*');
            if (fallback.error) throw fallback.error;
            data = fallback.data || [];
          } else {
            throw error;
          }
        }

        // Auto-seed default users if database is empty
        if (!data || data.length === 0) {
          const defaultUsers = [
            {
              id: '1',
              username: 'tabita',
              password: 'admin123',
              nama: 'Tabita Antika',
              email: 'tabita.antika@example.com',
              role: 'Administrasi Klaim',
            }
          ];
          const { error: seedError } = await supabase.from('users').insert(defaultUsers);
          if (!seedError) {
            return res.status(200).json(defaultUsers);
          } else {
            console.error('Auto-seed failed:', seedError.message);
            // Fallback: return defaultUsers so frontend has default accounts even if seed failed
            return res.status(200).json(defaultUsers);
          }
        }

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
    const { id, username, password, nama, email, role, foto, puskesmas } = req.body;
    if (!username || !password || !nama || !role) {
      return res.status(400).json({ error: 'Missing required user fields' });
    }

    try {
      const hashedPassword = password.startsWith('$2') ? password : bcrypt.hashSync(password, 10);
      if (isUsingSupabase()) {
        const supabase = getSupabase();
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .neq('id', id || 'null')
          .maybeSingle();
        if (existing) {
          return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        const userId = id || Date.now().toString();
        const newUser = {
          id: userId,
          username,
          password: hashedPassword,
          nama,
          email: email || '',
          role,
          foto: foto || '',
          puskesmas: puskesmas || '',
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
          password: hashedPassword,
          nama,
          email: email || '',
          role,
          foto: foto || '',
          puskesmas: puskesmas || '',
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
