import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { getSupabase, isSupabaseEnabled } from './supabase.js';

const dbFile = path.join(process.cwd(), 'server', 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

export async function prepareDb() {
  const useSupabase = isSupabaseEnabled();
  
  if (useSupabase) {
    const supabase = getSupabase();
    try {
      // For Supabase, just verify connection - return a proxy object
      return { supabase, data: null };
    } catch (err) {
      console.warn('Supabase connection failed, falling back to lowdb:', err.message);
    }
  }

  // Fallback to lowdb for local/offline mode
  await db.read();
  db.data ||= { uploads: [], users: [], messages: [], riwayat: [] };
  if (!Array.isArray(db.data.uploads)) db.data.uploads = [];
  if (!Array.isArray(db.data.users)) db.data.users = [];
  if (!Array.isArray(db.data.messages)) db.data.messages = [];
  if (!Array.isArray(db.data.riwayat)) db.data.riwayat = [];
  return db;
}

export async function getLocalDb() {
  await db.read();
  db.data ||= { uploads: [], users: [], messages: [], riwayat: [] };
  if (!Array.isArray(db.data.uploads)) db.data.uploads = [];
  if (!Array.isArray(db.data.users)) db.data.users = [];
  if (!Array.isArray(db.data.messages)) db.data.messages = [];
  if (!Array.isArray(db.data.riwayat)) db.data.riwayat = [];
  return db;
}

export async function saveDb() {
  try {
    await db.write();
  } catch (err) {
    console.warn('Gagal menulis ke local db (mungkin read-only filesystem di serverless environment):', err.message);
  }
}

export function isUsingSupabase() {
  return isSupabaseEnabled();
}

// Case mapping helpers for Supabase (which uses lowercase column names by default in PostgreSQL)
export const mapUploadToDb = (u) => {
  if (!u) return u;
  return {
    id: u.id,
    filename: u.fileName || null,
    filetype: u.fileType || null,
    filedata: u.fileData || null,
    videolink: u.videoLink || null,
    puskesmas: u.puskesmas,
    month: u.month,
    year: u.year,
    documenttype: u.documentType,
    uploadedat: u.uploadedAt,
    uploadedby: u.uploadedBy || null,
    status: u.status || null,
    keterangan: u.keterangan || null,
    analysis: u.analysis || null,
    lastmodified: u.lastModified || null,
    modifiedby: u.modifiedBy || null,
  };
};

export const mapUploadFromDb = (u) => {
  if (!u) return u;
  return {
    id: u.id,
    fileName: u.filename || u.fileName || undefined,
    fileType: u.filetype || u.fileType || undefined,
    fileData: u.filedata || u.fileData || undefined,
    videoLink: u.videolink || u.videoLink || undefined,
    puskesmas: u.puskesmas,
    month: u.month,
    year: u.year,
    documentType: u.documenttype || u.documentType,
    uploadedAt: u.uploadedat || u.uploadedAt,
    uploadedBy: u.uploadedby || u.uploadedBy || undefined,
    status: u.status || undefined,
    keterangan: u.keterangan || undefined,
    analysis: u.analysis || undefined,
    lastModified: u.lastmodified || u.lastModified || undefined,
    modifiedBy: u.modifiedby || u.modifiedBy || undefined,
  };
};

export const mapMessageToDb = (m) => {
  if (!m) return m;
  return {
    id: m.id,
    from: m.from,
    to: m.to,
    subject: m.subject,
    body: m.body,
    timestamp: m.timestamp,
    isRead: m.isRead !== undefined ? m.isRead : false,
    direction: m.direction || 'inbox',
    puskesmas: m.puskesmas || null
  };
};

export const mapMessageFromDb = (m) => {
  if (!m) return m;
  return {
    id: m.id,
    from: m.from,
    to: m.to,
    subject: m.subject,
    body: m.body,
    timestamp: m.timestamp,
    isRead: m.isRead !== undefined ? m.isRead : (m.isread !== undefined ? m.isread : false),
    direction: m.direction,
    puskesmas: m.puskesmas || undefined
  };
};

export const mapRiwayatToDb = (r) => {
  if (!r) return r;
  return {
    id: r.id,
    waktu: r.waktu,
    username: r.username || '',
    user_nama: r.user || r.user_nama || '',
    role: r.role,
    action: r.action,
    kategori: r.kategori,
    pesan: r.pesan,
    docid: r.docId || r.docid || null,
    puskesmas: r.puskesmas || null
  };
};

export const mapRiwayatFromDb = (r) => {
  if (!r) return r;
  return {
    id: r.id,
    waktu: r.waktu,
    username: r.username || '',
    user: r.user_nama || r.user || '',
    role: r.role,
    action: r.action,
    kategori: r.kategori,
    pesan: r.pesan,
    docId: r.docid || r.docId || undefined,
    puskesmas: r.puskesmas || undefined
  };
};


