import { prepareDb, saveDb, isUsingSupabase, getLocalDb, mapUploadToDb, mapUploadFromDb } from '../_db.js';
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
              .from('uploads')
              .select('*')
              .order('id', { ascending: true })
              .range(from, from + pageSize - 1);
              
            if (error) {
              const { data: data2, error: error2 } = await supabase.from('uploads').select('*');
              if (error2) throw error2;
              return res.status(200).json((data2 || []).map(mapUploadFromDb));
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
          
          return res.status(200).json(allData.map(mapUploadFromDb));
        } catch (err) {
          const { data, error } = await supabase.from('uploads').select('*');
          if (error) {
            try {
              const local = await getLocalDb();
              return res.status(200).json(local.data.uploads || []);
            } catch (e) {
              throw error;
            }
          }
          return res.status(200).json((data || []).map(mapUploadFromDb));
        }
      } else {
        const db = await prepareDb();
        return res.status(200).json(db.data.uploads);
      }
    } catch (error) {
      console.error('GET /api/uploads error:', error.message);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  if (req.method === 'POST') {
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
      if (isUsingSupabase()) {
        const supabase = getSupabase();
        const dbEntry = mapUploadToDb(uploadEntry);
        const { data: existing, error: existingError } = await supabase
          .from('uploads')
          .select('id')
          .eq('id', id)
          .maybeSingle();

        if (existing) {
          const { data, error } = await supabase
            .from('uploads')
            .update(dbEntry)
            .eq('id', id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('uploads')
            .insert([dbEntry]);
          if (error) throw error;
        }
      } else {
        const db = await prepareDb();
        const uploads = db.data.uploads;
        const existing = uploads.find((item) => item.id === id);
        if (existing) {
          Object.assign(existing, uploadEntry);
        } else {
          uploads.unshift(uploadEntry);
        }
        await saveDb();
      }

      return res.status(201).json({ success: true });
    } catch (error) {
      console.error('POST /api/uploads error:', error.message);
      // If Supabase schema/cache errors occur (missing column in PostgREST schema cache),
      // fallback to local LowDB persistence so uploads are not lost.
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('could not find the') || (msg.includes('column') && msg.includes('uploads'))) {
        try {
          const db = await getLocalDb();
          const uploads = db.data.uploads;
          const existing = uploads.find((item) => item.id === id);
          if (existing) Object.assign(existing, uploadEntry);
          else uploads.unshift(uploadEntry);
          await saveDb();
          return res.status(201).json({ success: true, fallback: 'local' });
        } catch (e) {
          console.error('Local fallback failed:', e.message);
          return res.status(500).json({ error: e.message || 'Server error' });
        }
      }

      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST,OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
