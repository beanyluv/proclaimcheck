import { getUsers, saveUsers } from './userData';
import { supabase } from './supabaseClient';
import bcrypt from 'bcryptjs';
import { addToSyncQueue } from './offlineQueue';

// helper convert base64 dataUrl ke Blob
function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export const API_URL = import.meta.env.VITE_API_URL?.trim() || '';

const FALLBACK_API_URLS = [API_URL, ''];

const buildUrl = (baseUrl: string, path: string) => {
  if (baseUrl.endsWith('/')) {
    return `${baseUrl.slice(0, -1)}${path}`;
  }
  return `${baseUrl}${path}`;
};

export interface UploadPayload {
  id: string;
  fileName?: string;
  fileData?: string;
  fileType?: string;
  videoLink?: string;
  puskesmas: string;
  month: string;
  year: string;
  documentType: string;
  uploadedAt: string;
  uploadedBy?: string;
  status?: string | null;
  keterangan?: string | null;
  analysis?: string | null;
  lastModified?: string | null;
  modifiedBy?: string | null;
}

const fetchWithFallback = async (path: string, options?: RequestInit) => {
  let lastError: unknown;
  for (const baseUrl of FALLBACK_API_URLS) {
    try {
      const response = await fetch(buildUrl(baseUrl, path), options);
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const parseJsonResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const bodyText = await response.text().catch(() => '');
    throw new Error(`Invalid JSON response: ${contentType}${bodyText ? ` | body: ${bodyText.slice(0, 120)}` : ''}`);
  }
  return response.json();
};

export async function uploadFileToServer(upload: UploadPayload) {
  // direct upload ke supabase storage kalo ada base64
  if (supabase && upload.fileData && upload.fileData.startsWith('data:')) {
    try {
      const blob = dataURLtoBlob(upload.fileData);
      const fileExt = upload.fileName ? upload.fileName.split('.').pop() : 'jpg';
      const storagePath = `${upload.id}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('uploads')
        .upload(storagePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('gagal upload ke storage, pake fallback base64:', error.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(storagePath);
        if (urlData?.publicUrl) {
          upload.fileData = urlData.publicUrl;
          console.log('[Supabase Storage] sukses upload:', upload.fileData);
        }
      }
    } catch (e: any) {
      console.warn('gagal proses upload supabase storage:', e.message);
    }
  }

  // kalo offline, masukin queue dulu
  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.log('[Offline] jaringan mati, simpan ke antrean');
    addToSyncQueue('upload', upload);
    return { success: true, queued: true };
  }

  try {
    const response = await fetchWithFallback('/api/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || response.statusText || 'Upload gagal');
    }

    return parseJsonResponse(response);
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const isNetworkError = errorMsg.includes('Failed to fetch') || 
                           errorMsg.includes('NetworkError') || 
                           errorMsg.includes('fetch');
    
    if (typeof window !== 'undefined' && isNetworkError) {
      console.warn('[Offline] koneksi gagal, simpan ke antrean luring:', errorMsg);
      addToSyncQueue('upload', upload);
      return { success: true, queued: true };
    }
    throw error;
  }
}

export async function getUploadedFilesFromServer() {
  const response = await fetchWithFallback('/api/uploads');
  if (!response.ok) {
    throw new Error('Gagal get data uploads');
  }
  return parseJsonResponse(response);
}

export async function getUsersFromServer() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      if (!error && data && data.length > 0) {
        data.sort((a: any, b: any) => {
          const ad = a.createdat || a.createdAt || '';
          const bd = b.createdat || b.createdAt || '';
          return bd.localeCompare(ad);
        });
        saveUsers(data);
        return data;
      }
    } catch (e: any) {
      console.warn('gagal get users via supabase, coba api server:', e.message);
    }
  }

  try {
    const response = await fetchWithFallback('/api/users');
    if (!response.ok) {
      throw new Error('Gagal get data users');
    }
    const serverUsers = await response.json();
    saveUsers(serverUsers);
    return serverUsers;
  } catch (error) {
    console.warn('gagal get users dari server, pake fallback local:', error);
    return getUsers();
  }
}

export async function createUserOnServer(user) {
  if (supabase) {
    try {
      const { error } = await supabase.from('users').insert([user]);
      if (error) console.warn('gagal tambah user ke supabase:', error.message);
    } catch (e: any) {
      console.warn('err tambah user supabase:', e.message);
    }
  }

  const response = await fetchWithFallback('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Gagal tambah user');
  }
  return response.json();
}

export async function updateUserOnServer(id, user) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('users')
        .update(user)
        .eq('id', id);
      if (error) console.warn('gagal update user ke supabase:', error.message);
    } catch (e: any) {
      console.warn('err update user supabase:', e.message);
    }
  }

  const response = await fetchWithFallback(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Gagal update user');
  }
  return response.json();
}

export async function deleteUserOnServer(id) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      if (error) console.warn('gagal hapus user di supabase:', error.message);
    } catch (e: any) {
      console.warn('err hapus user supabase:', e.message);
    }
  }

  const response = await fetchWithFallback(`/api/users/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Gagal hapus user');
  }
  return response.json();
}

export async function validateLoginOnServer(username, password) {
  const users = await getUsersFromServer();
  for (const u of users) {
    if (u.username === username) {
      const isMatch = u.password === password || (u.password.startsWith('$2') && bcrypt.compareSync(password, u.password));
      if (isMatch) {
        // migrasi password ke hash kalo masi plain text
        if (u.password === password) {
          const salt = bcrypt.genSaltSync(10);
          const hashedPassword = bcrypt.hashSync(password, salt);
          updateUserOnServer(u.id, { password: hashedPassword }).catch(err => {
            console.warn('gagal hash password plain:', err);
          });
          u.password = hashedPassword;
        }
        return u;
      }
    }
  }
  return null;
}

export async function getMessagesFromServer() {
  const response = await fetchWithFallback('/api/messages');
  if (!response.ok) {
    throw new Error('Gagal get messages');
  }
  return response.json();
}

export async function sendMessageToServer(message) {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.log('[Offline] jaringan mati, simpan pesan ke antrean');
    addToSyncQueue('message', message);
    return { success: true, queued: true };
  }

  try {
    const response = await fetchWithFallback('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || 'Gagal kirim pesan');
    }
    return response.json();
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const isNetworkError = errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('fetch');
    if (typeof window !== 'undefined' && isNetworkError) {
      console.warn('[Offline] gagal kirim pesan, simpan ke antrean:', errorMsg);
      addToSyncQueue('message', message);
      return { success: true, queued: true };
    }
    throw error;
  }
}

export async function getRiwayatFromServer() {
  const response = await fetchWithFallback('/api/riwayat');
  if (!response.ok) {
    throw new Error('Gagal get riwayat');
  }
  return response.json();
}

export async function addRiwayatToServer(riwayatItem: any) {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.log('[Offline] jaringan mati, simpan riwayat ke antrean');
    addToSyncQueue('riwayat', riwayatItem);
    return { success: true, queued: true };
  }

  try {
    const response = await fetchWithFallback('/api/riwayat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(riwayatItem),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || 'Gagal simpan riwayat');
    }
    return response.json();
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const isNetworkError = errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('fetch');
    if (typeof window !== 'undefined' && isNetworkError) {
      console.warn('[Offline] gagal simpan riwayat, simpan ke antrean:', errorMsg);
      addToSyncQueue('riwayat', riwayatItem);
      return { success: true, queued: true };
    }
    throw error;
  }
}

export async function markMessageDeletedOnServer(id: string, username: string) {
  const response = await fetchWithFallback('/api/messages', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, deletedByUsername: username }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Gagal hapus pesan');
  }
  return response.json();
}

export async function markMessageReadOnServer(id: string, isRead: boolean) {
  const response = await fetchWithFallback('/api/messages', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, isRead }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Gagal tandai pesan dibaca');
  }
  return response.json();
}
