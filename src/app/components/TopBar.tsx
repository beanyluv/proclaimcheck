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
  const currentUser = getCurrentUser();
  const name = userName || currentUser?.nama || 'Pengguna';
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [messages, setMessages] = useState<MessageItem[]>(() => getMessages());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotifications());
  const [messageTab, setMessageTab] = useState<MessageTab>('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [composeForm, setComposeForm] = useState({
    to: recipients[0],
    subject: '',
    body: '',
  });
  const panelRef = useRef<HTMLDivElement | null>(null);

  const unreadMessageCount = useMemo(
    () => messages.filter((msg) => msg.direction === 'inbox' && !msg.isRead).length,
    [messages]
  );
  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const filteredMessages = useMemo(() => {
    if (messageTab === 'sent') return messages.filter((msg) => msg.direction === 'sent');
    return messages.filter((msg) => msg.direction === 'inbox');
  }, [messages, messageTab]);

  const selectedMessage = useMemo(
    () => messages.find((msg) => msg.id === selectedMessageId) || null,
    [messages, selectedMessageId]
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

    const newMessage: MessageItem = {
      id: `msg-${Date.now()}`,
      from: name,
      to: composeForm.to,
      subject: composeForm.subject,
      body: composeForm.body,
      timestamp,
      isRead: true,
      direction: 'sent',
      puskesmas: composeForm.to.startsWith('Puskesmas') ? composeForm.to.replace('Puskesmas ', '') : undefined,
    };

    const updated = addMessage(newMessage);
    setMessages(updated);
    setComposeForm({ to: recipients[0], subject: '', body: '' });
    setMessageTab('sent');
    setSelectedMessageId(newMessage.id);
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
                          {recipients.map((recipient) => (
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
                      <div className="rounded-[16px] border border-[#e5ede9] bg-[#f8fbf7] p-4 text-[13px] text-[#3f554f] leading-6">
                        {selectedMessage.body}
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-[#5a6b64]">
                        <span>{selectedMessage.direction === 'sent' ? 'Terkirim ke' : 'Diterima dari'} {selectedMessage.direction === 'sent' ? selectedMessage.to : selectedMessage.from}</span>
                        {selectedMessage.puskesmas && <span>• Faskes: {selectedMessage.puskesmas}</span>}
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
          <img alt="Profile" className="w-[36px] h-[36px] rounded-full object-cover border-2 border-[rgba(0,0,0,0.1)] shadow-sm" src={avatarSrc} />
          <span className="font-['Mukta'] text-[16px] font-medium text-black">{name}</span>
        </div>
      </div>
    </div>
  );
}
