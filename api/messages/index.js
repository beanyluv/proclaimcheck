import { prepareDb, saveDb, isUsingSupabase, mapMessageToDb, mapMessageFromDb } from '../_db.js';
import { getSupabase } from '../supabase.js';

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
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
          .from('messages')
          .select('*')
          .order('createdat', { ascending: false });

        if (error) {
          const msg = (error.message || '').toLowerCase();
          if (msg.includes('createdat') || msg.includes('column') || msg.includes('does not exist')) {
            const fallback = await supabase.from('messages').select('*');
            if (fallback.error) throw fallback.error;
            data = fallback.data || [];
          } else if (msg.includes('relation') && msg.includes('does not exist')) {
            const db = await prepareDb();
            db.data.messages ||= [];
            return res.status(200).json(db.data.messages);
          } else {
            throw error;
          }
        }
        return res.status(200).json((data || []).map(mapMessageFromDb));
      } else {
        const db = await prepareDb();
        db.data.messages ||= [];
        return res.status(200).json(db.data.messages);
      }
    } catch (error) {
      console.error('GET /api/messages error:', error.message);
      try {
        const db = await prepareDb();
        db.data.messages ||= [];
        return res.status(200).json(db.data.messages);
      } catch (e) {
        return res.status(500).json({ error: error.message || 'Server error' });
      }
    }
  }

  if (req.method === 'POST') {
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
      timestamp: timestamp || new Date().toISOString(),
      isRead: isRead !== undefined ? isRead : false,
      direction: direction || 'inbox',
      puskesmas: puskesmas || null
    };

    try {
      if (isUsingSupabase()) {
        const supabase = getSupabase();
        const dbEntry = mapMessageToDb(newMessage);
        const { error } = await supabase
          .from('messages')
          .insert([dbEntry]);

        if (error) {
          const msg = (error.message || '').toLowerCase();
          if (msg.includes('relation') && msg.includes('does not exist')) {
            const db = await prepareDb();
            db.data.messages ||= [];
            db.data.messages.push(newMessage);
            await saveDb();
            return res.status(201).json(newMessage);
          }
          throw error;
        }
        return res.status(201).json(newMessage);
      } else {
        const db = await prepareDb();
        db.data.messages ||= [];
        db.data.messages.push(newMessage);
        await saveDb();
        return res.status(201).json(newMessage);
      }
    } catch (error) {
      console.error('POST /api/messages error:', error.message);
      try {
        const db = await prepareDb();
        db.data.messages ||= [];
        db.data.messages.push(newMessage);
        await saveDb();
        return res.status(201).json(newMessage);
      } catch (e) {
        return res.status(500).json({ error: e.message || 'Server error' });
      }
    }
  }

  if (req.method === 'PUT') {
    const { id, deletedByUsername, isRead } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing required field: id' });
    }

    try {
      if (isUsingSupabase()) {
        const supabase = getSupabase();
        
        // 1. Fetch current message
        const { data: currentMsg, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        
        const dbMsg = mapMessageFromDb(currentMsg);
        
        // 2. Add deleted user tag to body if provided
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

        // 3. Update isRead if provided
        if (isRead !== undefined) {
          dbMsg.isRead = isRead;
        }

        // 4. Update in Supabase
        const dbEntry = mapMessageToDb(dbMsg);
        const { error: updateError } = await supabase
          .from('messages')
          .update(dbEntry)
          .eq('id', id);

        if (updateError) throw updateError;
        
        return res.status(200).json(dbMsg);
      } else {
        const db = await prepareDb();
        db.data.messages ||= [];
        const index = db.data.messages.findIndex(m => m.id === id);
        if (index !== -1) {
          const msg = db.data.messages[index];
          
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
          
          await saveDb();
          return res.status(200).json(msg);
        }
        return res.status(404).json({ error: 'Message not found' });
      }
    } catch (error) {
      console.error('PUT /api/messages error:', error.message);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST,PUT,OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
