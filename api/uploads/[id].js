import { prepareDb } from '../_db.js';

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const db = await prepareDb();
    const upload = db.data.uploads.find((item) => item.id === req.query.id);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    return res.status(200).json(upload);
  }

  res.setHeader('Allow', 'GET,OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
