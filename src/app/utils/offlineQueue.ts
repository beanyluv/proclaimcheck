// antrean sync pas offline

export interface SyncItem {
  id: string;
  type: 'upload' | 'message' | 'riwayat';
  payload: any;
  timestamp: number;
  attempts: number;
}

const STORAGE_KEY = 'proclaim-sync-queue';
let isProcessing = false;

// ambil data dari localstorage
export const getSyncQueue = (): SyncItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// simpan antrean ke localstorage
const saveSyncQueue = (queue: SyncItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }
};

// tambah antrean baru
export const addToSyncQueue = (type: 'upload' | 'message' | 'riwayat', payload: any) => {
  if (typeof window === 'undefined') return;

  const queue = getSyncQueue();
  const id = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  const newItem: SyncItem = {
    id,
    type,
    payload,
    timestamp: Date.now(),
    attempts: 0,
  };

  // biar ga duplikat upload id yg sama
  if (payload.id && queue.some(item => item.payload.id === payload.id)) {
    console.log(`[OfflineQueue] ID ${payload.id} udah ada. skip.`);
    return;
  }

  queue.push(newItem);
  saveSyncQueue(queue);
  console.log(`[OfflineQueue] masuk antrean: ${type} (ID: ${id})`);

  if (navigator.onLine) {
    processSyncQueue();
  }
};

// jalankan antrean sync ke server
export const processSyncQueue = async () => {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) {
    console.log('[OfflineQueue] offline, pending...');
    return;
  }
  if (isProcessing) {
    console.log('[OfflineQueue] lagi proses, skip.');
    return;
  }

  const queue = getSyncQueue();
  if (queue.length === 0) return;

  isProcessing = true;
  console.log(`[OfflineQueue] mulai proses ${queue.length} item...`);

  try {
    // bypass circular dep
    const { uploadFileToServer, sendMessageToServer, addRiwayatToServer } = await import('./serverApi');
    const remainingQueue: SyncItem[] = [];

    for (const item of queue) {
      console.log(`[OfflineQueue] sync ${item.id} (${item.type}, coba ke-${item.attempts + 1})...`);
      
      try {
        if (item.type === 'upload') {
          await uploadFileToServer(item.payload);
        } else if (item.type === 'message') {
          await sendMessageToServer(item.payload);
        } else if (item.type === 'riwayat') {
          await addRiwayatToServer(item.payload);
        }

        console.log(`[OfflineQueue] sukses sync ${item.id}`);
        window.dispatchEvent(new CustomEvent('offline-synced', { detail: { type: item.type, payload: item.payload } }));
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        console.warn(`[OfflineQueue] gagal sync ${item.id}:`, errorMsg);
        
        // hapus kalo error permanent/400 biar ga gantung terus
        const isClientError = errorMsg.includes('400') || 
                              errorMsg.includes('sudah digunakan') || 
                              errorMsg.includes('Missing required');
        
        if (item.attempts >= 5 || isClientError) {
          console.warn(`[OfflineQueue] drop item ${item.id} karna err/max attempt`);
        } else {
          item.attempts += 1;
          remainingQueue.push(item);
          
          console.log('[OfflineQueue] hold antrean, coba nanti.');
          const currentIndex = queue.indexOf(item);
          remainingQueue.push(...queue.slice(currentIndex + 1));
          break;
        }
      }
    }

    saveSyncQueue(remainingQueue);
  } catch (error) {
    console.error('[OfflineQueue] err proses queue:', error);
  } finally {
    isProcessing = false;
    console.log('[OfflineQueue] kelar proses.');
  }
};

// handle koneksi online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] online lagi! sync mulai...');
    processSyncQueue();
  });

  window.addEventListener('load', () => {
    processSyncQueue();
  });
  
  setTimeout(processSyncQueue, 1500);
}
