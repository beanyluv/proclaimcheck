import { prepareDb, saveDb, isUsingSupabase, getLocalDb, mapRiwayatToDb, mapRiwayatFromDb } from '../_db.js';
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
        try {
          let allData = [];
          let from = 0;
          const pageSize = 1000;
          let hasMore = true;
          
          while (hasMore) {
            const { data, error } = await supabase
              .from('riwayat')
              .select('*')
              .order('id', { ascending: true })
              .range(from, from + pageSize - 1);
              
            if (error) {
              console.warn('Supabase riwayat table query failed, falling back to local database:', error.message);
              const local = await getLocalDb();
              return res.status(200).json(local.data.riwayat || []);
            }
            
            if (data && data.length > 0) {
              allData = allData.concat(data);
              if (data.length < pageSize) {
                hasMore = false;
              } else {
                from += pageSize;
              }
            } else {
              hasMore = false;
            }
          }
          
          return res.status(200).json(allData.map(mapRiwayatFromDb));
        } catch (err) {
          const local = await getLocalDb();
          return res.status(200).json(local.data.riwayat || []);
        }
      } else {
        const db = await prepareDb();
        return res.status(200).json(db.data.riwayat || []);
      }
    } catch (error) {
      console.error('GET /api/riwayat error:', error.message);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { id, waktu, username, user, role, action, kategori, pesan, docId, puskesmas } = req.body;

    // Validasi hanya field yang benar-benar wajib ada
    if (!id || !waktu || !pesan) {
      return res.status(400).json({ error: 'Missing required fields: id, waktu, pesan' });
    }

    const riwayatEntry = {
      id,
      waktu,
      username: username || '',
      user: user || '',
      role: role || 'Pengguna',
      action: action || 'Lainnya',
      kategori: kategori || 'Umum',
      pesan,
      docId: docId || null,
      puskesmas: puskesmas || null
    };

    try {
      if (isUsingSupabase()) {
        const supabase = getSupabase();
        const dbEntry = mapRiwayatToDb(riwayatEntry);
        
        const { error } = await supabase
          .from('riwayat')
          .insert([dbEntry]);
          
        if (error) {
          console.warn('[riwayat POST] Supabase insert gagal, jatuh ke lokal. Error:', error.message, '| Code:', error.code, '| Details:', error.details);
          const db = await getLocalDb();
          db.data.riwayat.unshift(riwayatEntry);
          await saveDb();
          return res.status(201).json({ success: true, fallback: 'local', supabaseError: error.message });
        }
      } else {
        const db = await prepareDb();
        db.data.riwayat.unshift(riwayatEntry);
        await saveDb();
      }

      return res.status(201).json({ success: true });
    } catch (error) {
      console.error('POST /api/riwayat error:', error.message);
      try {
        const db = await getLocalDb();
        db.data.riwayat.unshift(riwayatEntry);
        await saveDb();
        return res.status(201).json({ success: true, fallback: 'local' });
      } catch (e) {
        return res.status(500).json({ error: e.message || 'Server error' });
      }
    }
  }

  res.setHeader('Allow', 'GET,POST,OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
