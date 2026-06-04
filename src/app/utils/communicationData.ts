export type MessageDirection = 'inbox' | 'sent';

export interface MessageItem {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  direction: MessageDirection;
  puskesmas?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: 'verifikasi' | 'sistem' | 'summary';
  timestamp: string;
  isRead: boolean;
}

const MESSAGES_KEY = 'proclaim_check_messages';
const NOTIFICATIONS_KEY = 'proclaim_check_notifications';

const initialMessages: MessageItem[] = [
  {
    id: 'msg-001',
    from: 'Puskesmas Mulia Hati 1',
    to: 'Tabita Antika',
    subject: 'Permintaan verifikasi data pasien',
    body: 'Mohon bantu verifikasi berkas pasien dari Puskesmas Mulia Hati 1. Dokumen sudah lengkap dan tinggal proses final.',
    timestamp: '2026-05-28 08:45',
    isRead: false,
    direction: 'inbox',
    puskesmas: 'Mulia Hati 1',
  },
  {
    id: 'msg-002',
    from: 'Puskesmas Sehat Mandiri 1',
    to: 'Tabita Antika',
    subject: 'Status unggah berkas belum lengkap',
    body: 'Kami sudah mengunggah sebagian dokumen, tetapi masih ada berkas yang belum valid. Mohon tindak lanjut untuk status klaim.',
    timestamp: '2026-05-27 15:20',
    isRead: false,
    direction: 'inbox',
    puskesmas: 'Sehat Mandiri 1',
  },
  {
    id: 'msg-003',
    from: 'Tabita Antika',
    to: 'Puskesmas Harapan Kasih 2',
    subject: 'Konfirmasi hasil pemeriksaan',
    body: 'Terima kasih, mohon kirimkan kembali hasil pemeriksaan lanjutan untuk klaim yang sedang proses.',
    timestamp: '2026-05-25 13:10',
    isRead: true,
    direction: 'sent',
    puskesmas: 'Harapan Kasih 2',
  },
];

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-001',
    title: 'Faskes belum diverifikasi',
    description: 'Puskesmas Budi Mulia 2 memiliki 4 berkas belum diverifikasi. Segera cek dan verifikasi agar proses tidak tertunda.',
    category: 'verifikasi',
    timestamp: '2026-05-28 09:05',
    isRead: false,
  },
  {
    id: 'notif-002',
    title: 'Pembaruan sistem tersedia',
    description: 'Versi baru sistem siap dipasang. Update ini memperbaiki validasi unggahan berkas dan notifikasi email.',
    category: 'sistem',
    timestamp: '2026-05-27 17:30',
    isRead: false,
  },
  {
    id: 'notif-003',
    title: 'Ringkasan Mei',
    description: 'Sepanjang Mei 2026, 18 berkas lengkap, 12 terverifikasi, dan 2 ditolak. Buka ringkasan untuk detail setiap faskes.',
    category: 'summary',
    timestamp: '2026-06-01 08:00',
    isRead: false,
  },
];

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

let cachedMessages: MessageItem[] = [...initialMessages];
let cachedNotifications: NotificationItem[] = [...initialNotifications];

export const getMessages = (): MessageItem[] => {
  return cachedMessages;
};

export const saveMessages = (messages: MessageItem[]) => {
  cachedMessages = messages;
};

export const getNotifications = (): NotificationItem[] => {
  return cachedNotifications;
};

export const saveNotifications = (notifications: NotificationItem[]) => {
  cachedNotifications = notifications;
};

export const addMessage = (message: MessageItem) => {
  const messages = getMessages();
  const updated = [...messages, message];
  saveMessages(updated);
  return updated;
};

export const markAllNotificationsRead = () => {
  const notifications = getNotifications();
  const updated = notifications.map((item) => ({ ...item, isRead: true }));
  saveNotifications(updated);
  return updated;
};

export const markNotificationRead = (id: string) => {
  const notifications = getNotifications();
  const updated = notifications.map((item) => item.id === id ? { ...item, isRead: true } : item);
  saveNotifications(updated);
  return updated;
};
