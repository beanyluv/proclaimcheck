export const API_URL = import.meta.env.VITE_API_URL?.trim() || '';

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const FALLBACK_API_URLS = isLocalhost
  ? ['http://localhost:4000', 'http://localhost:4001', API_URL, '']
  : [API_URL, '', 'http://localhost:4000', 'http://localhost:4001'];

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
}

const fetchWithFallback = async (path: string, options?: RequestInit) => {
  let lastError: unknown;
  for (const baseUrl of FALLBACK_API_URLS) {
    try {
      const response = await fetch(buildUrl(baseUrl, path), options);
      return response;
    } catch (error) {
      lastError = error;
      // Try next fallback URL
    }
  }
  throw lastError;
};

const parseJsonResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const bodyText = await response.text().catch(() => '');
    throw new Error(`Invalid JSON response from server: ${contentType}${bodyText ? ` | body: ${bodyText.slice(0, 120)}` : ''}`);
  }
  return response.json();
};

export async function uploadFileToServer(upload: UploadPayload) {
  const response = await fetchWithFallback('/api/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(upload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error || response.statusText || 'Upload gagal';
    throw new Error(message);
  }

  return parseJsonResponse(response);
}

export async function getUploadedFilesFromServer() {
  const response = await fetchWithFallback('/api/uploads');
  if (!response.ok) {
    throw new Error('Gagal mengambil daftar unggahan dari server');
  }
  return parseJsonResponse(response);
}

export async function getUsersFromServer() {
  const response = await fetchWithFallback('/api/users');
  if (!response.ok) {
    throw new Error('Gagal mengambil daftar pengguna dari server');
  }
  return response.json();
}

export async function createUserOnServer(user) {
  const response = await fetchWithFallback('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Gagal menambahkan pengguna');
  }
  return response.json();
}

export async function updateUserOnServer(id, user) {
  const response = await fetchWithFallback(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Gagal memperbarui pengguna');
  }
  return response.json();
}

export async function deleteUserOnServer(id) {
  const response = await fetchWithFallback(`/api/users/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Gagal menghapus pengguna');
  }
  return response.json();
}

export async function validateLoginOnServer(username, password) {
  const users = await getUsersFromServer();
  return users.find((u) => u.username === username && u.password === password) || null;
}
