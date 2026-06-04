import { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentUser } from '../utils/userData';
import {
  addMessage,
  getMessages,
  getNotifications,
  markAllNotificationsRead,
  saveMessages,
  MessageItem,
  NotificationItem,
} from '../utils/communicationData';
import { getMessagesFromServer, sendMessageToServer, markMessageDeletedOnServer, markMessageReadOnServer } from '../utils/serverApi';
import { supabase } from '../utils/supabaseClient';

interface TopBarProps {
  title: string;
  avatarSrc: string;
  userName?: string;
}

type ActivePanel = 'messages' | 'notifications' | null;

type MessageTab = 'inbox' | 'sent' | 'compose';

const recipients = [
  'Administrasi Klaim',
  'Puskesmas Mulia Hati 1',
  'Puskesmas Budi Mulia 2',
  'Puskesmas Harapan Kasih 2',
  'Puskesmas Sehat Mandiri 1',
];

const categoryStyles: Record<NotificationItem['category'], string> = {
  verifikasi: 'bg-[#fbe8d4] text-[#9b5b0b]',
  sistem: 'bg-[#d8e9fe] text-[#0f4ea5]',
  summary: 'bg-[#e4f5e6] text-[#1f6f5f]',
};

const getUserPuskesmas = (user: any): string | null => {
  if (!user || user.role !== 'Petugas Puskesmas') return null;
  const nameLower = (user.nama || '').toLowerCase();
  const usernameLower = (user.username || '').toLowerCase();
  const emailLower = (user.email || '').toLowerCase();
  
  const list = [
    'Mulia Hati 1', 'Mulia Hati 2',
    'Budi Mulia 1', 'Budi Mulia 2',
    'Harapan Kasih 1', 'Harapan Kasih 2',
    'Sentosa 1', 'Sentosa 2',
    'Citra Medika 1', 'Citra Medika 2',
    'Sehat Mandiri 1', 'Sehat Mandiri 2'
  ];
  
  for (const p of list) {
    if (nameLower.includes(p.toLowerCase())) {
      return `Puskesmas ${p}`;
    }
  }
  for (const p of list) {
    const cleanP = p.replace(/\s+/g, '').toLowerCase();
    if (usernameLower.includes(cleanP)) {
      return `Puskesmas ${p}`;
    }
  }
  for (const p of list) {
    const cleanP = p.replace(/\s+/g, '').toLowerCase();
    if (emailLower.includes(cleanP)) {
      return `Puskesmas ${p}`;
    }
  }
  return null;
};

const formatDate = (value: string) => {
  const date = new Date(value.replace(/\-/g, '/'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TopBar({ title, avatarSrc, userName }: TopBarProps) {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentUser(getCurrentUser());
      setPreviewAvatar(null);
    };
    const handlePreviewUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setPreviewAvatar(customEvent.detail);
      }
    };
    window.addEventListener('profile-updated', handleUpdate);
    window.addEventListener('settings-updated', handleUpdate);
    window.addEventListener('profile-preview-updated', handlePreviewUpdate);
    return () => {
      window.removeEventListener('profile-updated', handleUpdate);
      window.removeEventListener('settings-updated', handleUpdate);
      window.removeEventListener('profile-preview-updated', handlePreviewUpdate);
    };
  }, []);

  const name = currentUser?.nama || userName || 'Pengguna';
  const avatar = previewAvatar
    ? previewAvatar
    : (currentUser?.foto && currentUser.foto.startsWith('data:image/') && currentUser.foto.length > 100
      ? currentUser.foto
      : avatarSrc);
  
  const dynamicRecipients = useMemo(() => {
    if (currentUser?.role === 'Administrasi Klaim') {
      return [
        'Puskesmas Mulia Hati 1',
        'Puskesmas Mulia Hati 2',
        'Puskesmas Budi Mulia 1',
        'Puskesmas Budi Mulia 2',
        'Puskesmas Harapan Kasih 1',
        'Puskesmas Harapan Kasih 2',
        'Puskesmas Sentosa 1',
        'Puskesmas Sentosa 2',
        'Puskesmas Citra Medika 1',
        'Puskesmas Citra Medika 2',
        'Puskesmas Sehat Mandiri 1',
        'Puskesmas Sehat Mandiri 2',
      ];
    } else {
      return ['Administrasi Klaim'];
    }
  }, [currentUser?.role]);

  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [messages, setMessages] = useState<MessageItem[]>(() => getMessages());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotifications());
  const [messageTab, setMessageTab] = useState<MessageTab>('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [composeForm, setComposeForm] = useState({
    to: dynamicRecipients[0],
    subject: '',
    body: '',
  });

  useEffect(() => {
    setComposeForm(prev => ({ ...prev, to: dynamicRecipients[0] }));
  }, [dynamicRecipients]);

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const serverMessages = await getMessagesFromServer();
        if (serverMessages) {
          setMessages(() => {
            const localMsgs = getMessages();
            const serverMsgIds = new Set(serverMessages.map((m: any) => m.id));
            const localOnlyMsgs = localMsgs.filter((m: any) => !serverMsgIds.has(m.id));
            
            const userPuskesmas = currentUser?.puskesmas || getUserPuskesmas(currentUser);
            const userPuskesmasShort = userPuskesmas ? userPuskesmas.replace('Puskesmas ', '') : '';

            const formattedServerMsgs = serverMessages
              .filter((m: any) => {
                if (currentUser?.role === 'Administrasi Klaim') {
                  return true;
                }
                const isFromMe = m.from === name || m.from === currentUser?.nama || (userPuskesmas && m.from === userPuskesmas);
                const isToMe = m.to === name || m.to === currentUser?.nama || (userPuskesmas && m.to === userPuskesmas);
                const matchesPuskesmasField = m.puskesmas && userPuskesmasShort && 
                  (m.puskesmas.toLowerCase() === userPuskesmasShort.toLowerCase() || 
                   m.puskesmas.toLowerCase() === userPuskesmas.toLowerCase());
                return isFromMe || isToMe || matchesPuskesmasField;
              })
              .map((m: any) => {
                const isFromMe = m.from === name || 
                                 m.from === currentUser?.nama || 
                                 (currentUser?.role === 'Administrasi Klaim' && m.from === 'Administrasi Klaim') ||
                                 (userPuskesmas && m.from === userPuskesmas);
                const direction = isFromMe ? 'sent' : 'inbox';
                const localVersion = localMsgs.find(lm => lm.id === m.id);
                
                return {
                  id: m.id,
                  from: m.from,
                  to: m.to,
                  subject: m.subject,
                  body: m.body,
                  timestamp: m.timestamp,
                  isRead: localVersion ? localVersion.isRead : m.isRead,
                  direction,
                  puskesmas: m.puskesmas || undefined
                };
              });
            
            const filteredLocalOnly = localOnlyMsgs.filter((m: any) => {
              if (currentUser?.role === 'Administrasi Klaim') {
                return true;
              }
              const isFromMe = m.from === name || m.from === currentUser?.nama || (userPuskesmas && m.from === userPuskesmas);
              const isToMe = m.to === name || m.to === currentUser?.nama || (userPuskesmas && m.to === userPuskesmas);
              return isFromMe || isToMe;
            });

            const merged = [...formattedServerMsgs, ...filteredLocalOnly];
            merged.sort((a, b) => b.id.localeCompare(a.id));
            saveMessages(merged);
            return merged;
          });
        }
      } catch (err) {
        console.warn('Gagal memuat pesan dari server:', err);
      }
    };
    
    fetchMessages();

    // Supabase Realtime Subscription for instantaneous delivery
    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel('public-messages-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const m = payload.new;
            const userPuskesmas = currentUser?.puskesmas || getUserPuskesmas(currentUser);
            const userPuskesmasShort = userPuskesmas ? userPuskesmas.replace('Puskesmas ', '') : '';

            const isFromMe = m.from === name || m.from === currentUser?.nama || (userPuskesmas && m.from === userPuskesmas);
            const isToMe = m.to === name || m.to === currentUser?.nama || (userPuskesmas && m.to === userPuskesmas);
            const matchesPuskesmasField = m.puskesmas && userPuskesmasShort && 
              (m.puskesmas.toLowerCase() === userPuskesmasShort.toLowerCase() || 
               m.puskesmas.toLowerCase() === userPuskesmas.toLowerCase());

            if (currentUser?.role === 'Administrasi Klaim' || isFromMe || isToMe || matchesPuskesmasField) {
              const direction = isFromMe ? 'sent' : 'inbox';
              const newMsg: MessageItem = {
                id: m.id,
                from: m.from,
                to: m.to,
                subject: m.subject,
                body: m.body,
                timestamp: m.timestamp,
                isRead: m.isread !== undefined ? m.isread : m.isRead,
                direction,
                puskesmas: m.puskesmas || undefined
              };

              setMessages((prev) => {
                if (prev.some((msg) => msg.id === newMsg.id)) return prev;
                const updated = [newMsg, ...prev];
                updated.sort((a, b) => b.id.localeCompare(a.id));
                saveMessages(updated);
                return updated;
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          (payload) => {
            const m = payload.new;
            setMessages((prev) => {
              const updated = prev.map((msg) => {
                if (msg.id === m.id) {
                  return {
                    ...msg,
                    body: m.body,
                    isRead: m.isread !== undefined ? m.isread : m.isRead
                  };
                }
                return msg;
              });
              saveMessages(updated);
              return updated;
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'messages' },
          (payload) => {
            const deletedId = payload.old.id;
            setMessages((prev) => {
              const updated = prev.filter((msg) => msg.id !== deletedId);
              saveMessages(updated);
              return updated;
            });
          }
        )
        .subscribe();
    }

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [name, currentUser?.nama, currentUser?.role]);

  // Helper untuk mengecek apakah user saat ini telah menghapus pesan
  const isDeletedByUser = (body: string | null | undefined, username: string) => {
    if (!body) return false;
    const match = body.match(/<!--deleted_by:(.*?)-->/);
    if (!match) return false;
    const users = match[1].split(',').filter(Boolean);
    return users.includes(username);
  };

  // Helper untuk membersihkan metadata tag hapus dari isi pesan utama
  const getCleanBody = (body: string | null | undefined) => {
    if (!body) return '';
    return body.replace(/<!--deleted_by:(.*?)-->/, '').trim();
  };

  const currentUsername = currentUser?.username || 'unknown';

  // Saring hanya pesan-pesan yang tidak dihapus oleh user saat ini
  const visibleMessages = useMemo(() => {
    return messages.filter((msg) => !isDeletedByUser(msg.body, currentUsername));
  }, [messages, currentUsername]);

  const unreadMessageCount = useMemo(
    () => visibleMessages.filter((msg) => msg.direction === 'inbox' && !msg.isRead).length,
    [visibleMessages]
  );
  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const filteredMessages = useMemo(() => {
    if (messageTab === 'sent') return visibleMessages.filter((msg) => msg.direction === 'sent');
    return visibleMessages.filter((msg) => msg.direction === 'inbox');
  }, [visibleMessages, messageTab]);

  const selectedMessage = useMemo(
    () => visibleMessages.find((msg) => msg.id === selectedMessageId) || null,
    [visibleMessages, selectedMessageId]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) return;
      setActivePanel(null);
      setSelectedMessageId(null);
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activePanel === 'notifications') {
      const updated = markAllNotificationsRead();
      setNotifications(updated);
    }
  }, [activePanel]);

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel((current) => (current === panel ? null : panel));
    if (panel === 'messages') {
      setMessageTab('inbox');
      setSelectedMessageId(null);
    }
  };

  const handleOpenMessage = (message: MessageItem) => {
    if (message.direction === 'inbox' && !message.isRead) {
      const updated = messages.map((msg) =>
        msg.id === message.id ? { ...msg, isRead: true } : msg
      );
      saveMessages(updated);
      setMessages(updated);
      
      // Sinkronisasi status dibaca ke server Supabase agar persisten saat ganti sesi/refresh
      markMessageReadOnServer(message.id, true).catch(err => {
        console.warn('Gagal menandai pesan terbaca di server:', err);
      });
    }
    setSelectedMessageId(message.id);
  };

  const handleSendMessage = () => {
    if (!composeForm.subject.trim() || !composeForm.body.trim()) {
      return;
    }

    const timestamp = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const userPuskesmas = currentUser?.puskesmas || getUserPuskesmas(currentUser);
    const puskesmasVal = userPuskesmas 
      ? userPuskesmas.replace('Puskesmas ', '') 
      : (composeForm.to.startsWith('Puskesmas') ? composeForm.to.replace('Puskesmas ', '') : undefined);

    const newMessage: MessageItem = {
      id: `msg-${Date.now()}`,
      from: currentUser?.nama || name,
      to: composeForm.to,
      subject: composeForm.subject,
      body: composeForm.body,
      timestamp,
      isRead: false,
      direction: 'sent',
      puskesmas: puskesmasVal,
    };

    const updated = addMessage(newMessage);
    setMessages(updated);
    
    // Kirim pesan ke server Supabase secara real-time
    sendMessageToServer(newMessage).catch(err => {
      console.warn('Gagal sinkronisasi pesan ke database server:', err);
    });

    setComposeForm({ to: dynamicRecipients[0], subject: '', body: '' });
    setMessageTab('sent');
    setSelectedMessageId(newMessage.id);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pesan ini?')) {
      return;
    }

    try {
      // 1. Perbarui status di server (tambahkan tag hapus)
      await markMessageDeletedOnServer(messageId, currentUsername);
    } catch (err) {
      console.warn('Gagal sinkronisasi hapus ke database server, lakukan offline:', err);
    }

    // 2. Perbarui state lokal dengan menyisipkan tag hapus ke body in-memory
    const updated = messages.map((msg) => {
      if (msg.id === messageId) {
        const users = isDeletedByUser(msg.body, currentUsername) ? [] : [currentUsername];
        const match = (msg.body || '').match(/<!--deleted_by:(.*?)-->/);
        const prevUsers = match ? match[1].split(',').filter(Boolean) : [];
        const mergedUsers = Array.from(new Set([...prevUsers, ...users]));
        const cleanBody = (msg.body || '').replace(/<!--deleted_by:(.*?)-->/, '').trim();
        
        return {
          ...msg,
          body: `${cleanBody}\n\n<!--deleted_by:${mergedUsers.join(',')}-->`
        };
      }
      return msg;
    });

    saveMessages(updated);
    setMessages(updated);

    if (selectedMessageId === messageId) {
      setSelectedMessageId(null);
    }
  };

  return (
    <div ref={panelRef} className="h-[53px] bg-[#d9ece3] flex items-center justify-between px-6 flex-shrink-0 relative z-20">
      <h1 className="text-[23px] text-[#a8a8a8] font-['Mukta']">{title}</h1>
      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            type="button"
            aria-label="Buka pesan"
            onClick={() => togglePanel('messages')}
            className="relative p-2 rounded-full hover:bg-white/90 transition-colors"
          >
            <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FB4A4A] rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-white font-bold">
                {unreadMessageCount}
              </span>
            )}
          </button>

          {activePanel === 'messages' && (
            <div className="absolute right-0 mt-3 w-[380px] max-h-[520px] overflow-hidden rounded-[18px] border border-[#d8e8e1] bg-white shadow-xl">
              <div className="flex border-b border-[#e5ede9]">
                {(['inbox', 'sent', 'compose'] as MessageTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setMessageTab(tab);
                      setSelectedMessageId(null);
                    }}
                    className={`flex-1 px-4 py-3 text-left font-['Mukta'] text-[13px] ${messageTab === tab ? 'bg-[#f5faf7] text-[#1f6f5f] font-semibold' : 'text-[#6d6d6d]'}`}
                  >
                    {tab === 'inbox' ? 'Inbox' : tab === 'sent' ? 'Terkirim' : 'Kirim Pesan'}
                  </button>
                ))}
              </div>
              <div className="flex min-h-[320px]">
                <div className="w-[145px] border-r border-[#e5ede9] overflow-y-auto bg-[#f8fdf8]">
                  {messageTab !== 'compose' ? (
                    filteredMessages.length > 0 ? (
                      filteredMessages.map((message) => (
                        <button
                          key={message.id}
                          type="button"
                          onClick={() => handleOpenMessage(message)}
                          className={`w-full text-left px-4 py-3 border-b border-[#edf5ef] transition-colors ${selectedMessageId === message.id ? 'bg-white' : 'hover:bg-white'}`}
                        >
                          <p className="font-['Mukta'] text-[12px] font-semibold text-[#233b32] truncate">{message.subject}</p>
                          <p className="font-['Mukta'] text-[11px] text-[#667368] truncate">{message.from}</p>
                          <p className="font-['Mukta'] text-[10px] text-[#8c968f] mt-1 truncate">{message.timestamp}</p>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-[13px] text-[#6d6d6d]">Tidak ada pesan di tab ini.</div>
                    )
                  ) : (
                    <div className="p-4 text-[13px] text-[#6d6d6d]">Tulis pesan baru ke faskes atau pihak internal.</div>
                  )}
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  {messageTab === 'compose' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[12px] text-[#4d5f57] mb-2">Kepada</label>
                        <select
                          aria-label="Pilih penerima pesan"
                          value={composeForm.to}
                          onChange={(event) => setComposeForm({ ...composeForm, to: event.target.value })}
                          className="w-full rounded-lg border border-[#d8e8e1] px-3 py-2 text-[13px]"
                        >
                          {dynamicRecipients.map((recipient) => (
                            <option key={recipient} value={recipient}>{recipient}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] text-[#4d5f57] mb-2">Subjek</label>
                        <input
                          value={composeForm.subject}
                          onChange={(event) => setComposeForm({ ...composeForm, subject: event.target.value })}
                          className="w-full rounded-lg border border-[#d8e8e1] px-3 py-2 text-[13px]"
                          placeholder="Contoh: Request verifikasi berkas"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-[#4d5f57] mb-2">Pesan</label>
                        <textarea
                          value={composeForm.body}
                          onChange={(event) => setComposeForm({ ...composeForm, body: event.target.value })}
                          rows={7}
                          className="w-full rounded-lg border border-[#d8e8e1] px-3 py-2 text-[13px] resize-none"
                          placeholder="Tulis pesan kepada faskesmas atau tim internal..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        className="inline-flex items-center justify-center rounded-full bg-[#1f6f5f] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#17564c]"
                      >
                        Kirim Pesan
                      </button>
                    </div>
                  ) : selectedMessage ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-semibold text-[#1d3e35]">{selectedMessage.subject}</p>
                          <p className="text-[12px] text-[#5f6f68] mt-1">Dari: {selectedMessage.from}</p>
                        </div>
                        <span className="text-[11px] text-[#7c8a82]">{selectedMessage.timestamp}</span>
                      </div>
                      <div className="rounded-[16px] border border-[#e5ede9] bg-[#f8fbf7] p-4 text-[13px] text-[#3f554f] leading-6 whitespace-pre-wrap">
                        {getCleanBody(selectedMessage.body)}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[12px] text-[#5a6b64]">
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{selectedMessage.direction === 'sent' ? 'Terkirim ke' : 'Diterima dari'} {selectedMessage.direction === 'sent' ? selectedMessage.to : selectedMessage.from}</span>
                          {selectedMessage.puskesmas && <span className="truncate">• Faskes: {selectedMessage.puskesmas}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(selectedMessage.id)}
                          className="flex items-center gap-1 text-[#FB4A4A] hover:text-[#d32f2f] font-semibold transition-colors cursor-pointer flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center text-[13px] text-[#6d6d6d]">
                      <p className="font-semibold text-[#2f4c42]">Pilih pesan untuk melihat detail</p>
                      <p className="mt-2">Atau buat pesan baru dengan tab Kirim Pesan.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Buka notifikasi"
            onClick={() => togglePanel('notifications')}
            className="relative p-2 rounded-full hover:bg-white/90 transition-colors"
          >
            <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FB4A4A] rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-white font-bold">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {activePanel === 'notifications' && (
            <div className="absolute right-0 mt-3 w-[360px] max-h-[520px] overflow-hidden rounded-[18px] border border-[#d8e8e1] bg-white shadow-xl">
              <div className="p-4 border-b border-[#e5ede9]">
                <p className="text-[15px] font-semibold text-[#1f6f5f]">Notifikasi</p>
                <p className="text-[12px] text-[#667368] mt-1">Pengingat verifikasi, pembaruan sistem, dan ringkasan bulanan.</p>
              </div>
              <div className="max-h-[440px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-[#eef4ef] ${notification.isRead ? 'bg-white' : 'bg-[#f8fff8]'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[14px] font-semibold text-[#1f4f3f]">{notification.title}</p>
                          <p className="text-[12px] text-[#5d6b62] leading-5">{notification.description}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${categoryStyles[notification.category]}`}>
                          {notification.category}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-[#7d8c83]">
                        <span>{formatDate(notification.timestamp)}</span>
                        {!notification.isRead && <span className="text-[#1f6f5f] font-semibold">Baru</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-[13px] text-[#6d6d6d]">Tidak ada notifikasi baru.</div>
                )}
              </div>
              <div className="border-t border-[#e5ede9] p-4 text-[12px] text-[#4f5f57] bg-[#f7fcf7]">
                <p className="font-semibold text-[#1f6f5f]">Ringkasan Cepat</p>
                <p className="mt-2">{messages.filter((item) => item.direction === 'inbox').length} pesan masuk • {messages.filter((item) => item.direction === 'sent').length} pesan terkirim.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mr-2">
          <img alt="Profile" className="w-[36px] h-[36px] rounded-full object-cover border-2 border-[rgba(0,0,0,0.1)] shadow-sm" src={avatar} />
          <span className="font-['Mukta'] text-[16px] font-medium text-black">{name}</span>
        </div>
      </div>
    </div>
  );
}
