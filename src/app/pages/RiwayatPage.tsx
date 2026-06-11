import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from '../utils/subdomain';
import { getRiwayatList, syncRiwayat } from '../utils/documentData';
import { getCurrentUser } from '../utils/userData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

export default function RiwayatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  const [filterUser, setFilterUser] = useState('Pengguna');
  const [filterRole, setFilterRole] = useState('Peran');
  const [filterKegiatan, setFilterKegiatan] = useState('Kegiatan');
  const [filterWaktu, setFilterWaktu] = useState('Jangka Waktu');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isVerifikasiExpanded, setIsVerifikasiExpanded] = useState(true);
  const [riwayatData, setRiwayatData] = useState<any[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/');
      return;
    }
  }, [navigate]);

  // Load riwayat dari server dan update secara real-time (setiap 5 detik)
  useEffect(() => {
    const loadRiwayat = async () => {
      try {
        const data = await syncRiwayat();
        setRiwayatData(data);
      } catch (err) {
        console.error('Gagal memuat riwayat:', err);
        setRiwayatData(getRiwayatList());
      }
    };
    loadRiwayat();
    const interval = setInterval(loadRiwayat, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper untuk normalisasi Puskesmas
  const normalizePuskesmas = (name: string | null | undefined) => {
    if (!name) return '';
    return name.replace(/^Puskesmas\s+/i, '').trim().toLowerCase();
  };

  // Terapkan aturan visibilitas berbasis role & faskes sesuai request user
  const allowedRiwayatData = riwayatData.filter(item => {
    if (!currentUser) return false;
    
    // Admin Klaim (Administrasi Klaim) hanya bisa melihat riwayat aktivitas sesama akun Administrasi Klaim
    if (currentUser.role === 'Administrasi Klaim') {
      const itemRole = item.role || '';
      return itemRole === 'Administrasi Klaim';
    }
    
    // Petugas Puskesmas hanya bisa melihat dirinya dan akun lain yang role Petugas Puskesmas yang terdaftar di Puskesmas yang sama
    if (currentUser.role === 'Petugas Puskesmas') {
      const itemRole = item.role || '';
      const itemPuskesmas = item.puskesmas || '';
      
      const matchRole = itemRole === 'Petugas Puskesmas';
      const matchPuskesmas = normalizePuskesmas(itemPuskesmas) === normalizePuskesmas(currentUser.puskesmas);
      
      return matchRole && matchPuskesmas;
    }
    
    return false;
  });

  // Ambil pilihan nama user secara dinamis dari log yang diperbolehkan untuk menjaga privasi
  const userOptions = Array.from(new Set(
    allowedRiwayatData.map(item => item.user).filter(Boolean)
  ));

  // Saring data berdasarkan input filter interaktif di atas dataset yang aman (allowedRiwayatData)
  const filteredData = allowedRiwayatData.filter(item => {
    const matchUser = filterUser === 'Pengguna' || item.user === filterUser;
    const matchRole = filterRole === 'Peran' || item.role === filterRole;
    const matchKegiatan = filterKegiatan === 'Kegiatan' || item.action === filterKegiatan;
    
    // Filter jangka waktu menggunakan timestamp dari item.id (Date.now() + random)
    let matchWaktu = true;
    if (filterWaktu !== 'Jangka Waktu' && item.id) {
      const logTimestamp = Number(item.id.substring(0, 13));
      if (!isNaN(logTimestamp)) {
        const now = Date.now();
        const diffMs = now - logTimestamp;
        if (filterWaktu === 'Hari Ini') {
          matchWaktu = diffMs <= 24 * 60 * 60 * 1000;
        } else if (filterWaktu === 'Minggu Ini') {
          matchWaktu = diffMs <= 7 * 24 * 60 * 60 * 1000;
        } else if (filterWaktu === 'Bulan Ini') {
          matchWaktu = diffMs <= 30 * 24 * 60 * 60 * 1000;
        }
      }
    }
    
    const itemWaktu = (item.waktu || '').toLowerCase();
    const itemUser = (item.user || '').toLowerCase();
    const itemRole = (item.role || '').toLowerCase();
    const itemAction = (item.action || '').toLowerCase();
    const itemPesan = (item.pesan || '').toLowerCase();
    const itemKategori = (item.kategori || '').toLowerCase();
    const term = searchQuery.toLowerCase();

    const matchSearch = searchQuery === '' ||
      itemWaktu.includes(term) ||
      itemUser.includes(term) ||
      itemRole.includes(term) ||
      itemAction.includes(term) ||
      itemPesan.includes(term) ||
      itemKategori.includes(term);

    return matchUser && matchRole && matchKegiatan && matchWaktu && matchSearch;
  });

  // --- Saved queries logic ---
  const STORAGE_KEY = 'riwayatSavedQueries_v1';

  // load saved queries from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedQueries(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedSavedIndex, setSelectedSavedIndex] = useState<number | null>(null);

  const saveQueriesToStorage = (arr: any[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      // ignore
    }
  };

  const handleNewQuery = () => {
    setFilterUser('Pengguna');
    setFilterRole('Peran');
    setFilterKegiatan('Kegiatan');
    setFilterWaktu('Jangka Waktu');
    setSearchQuery('');
    setStatusMsg('New query siap');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleConfirmSave = () => {
    const name = saveName.trim() || `Query ${new Date().toLocaleString()}`;
    const payload = { name, createdAt: new Date().toISOString(), filters: { filterUser, filterRole, filterKegiatan, filterWaktu, searchQuery } };
    let updated;
    if (editingIndex !== null && editingIndex >= 0 && editingIndex < savedQueries.length) {
      updated = [...savedQueries];
      updated[editingIndex] = { ...updated[editingIndex], name, filters: payload.filters };
    } else {
      updated = [...savedQueries, payload];
    }
    setSavedQueries(updated);
    saveQueriesToStorage(updated);
    setIsSaveModalOpen(false);
    setSaveName('');
    setEditingIndex(null);
    setStatusMsg('Query disimpan');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleReset = () => {
    if (savedQueries.length > 0) {
      const last = savedQueries[savedQueries.length - 1];
      const f = last.filters || {};
      setFilterUser(f.filterUser || 'Pengguna');
      setFilterRole(f.filterRole || 'Peran');
      setFilterKegiatan(f.filterKegiatan || 'Kegiatan');
      setFilterWaktu(f.filterWaktu || 'Jangka Waktu');
      setSearchQuery(f.searchQuery || '');
      setStatusMsg(`Memulihkan "${last.name}"`);
    } else {
      handleNewQuery();
      setStatusMsg('Tidak ada query tersimpan, membersihkan filter');
    }
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const applySavedQuery = (index: number) => {
    const q = savedQueries[index];
    if (!q) return;
    const f = q.filters || {};
    setFilterUser(f.filterUser || 'Pengguna');
    setFilterRole(f.filterRole || 'Peran');
    setFilterKegiatan(f.filterKegiatan || 'Kegiatan');
    setFilterWaktu(f.filterWaktu || 'Jangka Waktu');
    setSearchQuery(f.searchQuery || '');
    setStatusMsg(`Query "${q.name}" diterapkan`);
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const startEditSaved = (index: number) => {
    const q = savedQueries[index];
    if (!q) return;
    setEditingIndex(index);
    setSaveName(q.name || '');
    setIsSaveModalOpen(true);
  };

  const deleteSavedQuery = (index: number) => {
    const q = savedQueries[index];
    if (!q) return;
    if (!window.confirm(`Hapus query '${q.name}'?`)) return;
    const updated = savedQueries.filter((_, i) => i !== index);
    setSavedQueries(updated);
    saveQueriesToStorage(updated);
    setStatusMsg('Query dihapus');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  // auto-fill saveName when opening modal (if not editing)
  useEffect(() => {
    if (isSaveModalOpen && editingIndex === null) {
      const parts = [];
      if (filterUser && filterUser !== 'Pengguna') parts.push(filterUser);
      if (filterRole && filterRole !== 'Peran') parts.push(filterRole);
      if (filterKegiatan && filterKegiatan !== 'Kegiatan') parts.push(filterKegiatan);
      if (filterWaktu && filterWaktu !== 'Jangka Waktu') parts.push(filterWaktu);
      const auto = parts.length > 0 ? parts.join(' — ') : 'Query Baru';
      setSaveName(auto + ` ${new Date().toLocaleDateString()}`);
    }
  }, [isSaveModalOpen, editingIndex]);

  return (
    <>
          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => handleNewQuery() } className="font-['Mukta'] text-[15px] text-black hover:underline">
              New Query
            </button>
            <button onClick={() => { setEditingIndex(null); setIsSaveModalOpen(true); }} className="font-['Mukta'] text-[15px] text-[#0066ff] hover:underline">
              Save As
            </button>
            <button onClick={() => handleReset()} className="font-['Mukta'] text-[15px] text-[#0066ff] hover:underline">
              Reset
            </button>

            {savedQueries.length > 0 && (
              <div className="flex items-center gap-2 ml-3">
                <select title="Saved Queries" value={selectedSavedIndex ?? ''} onChange={e => setSelectedSavedIndex(e.target.value === '' ? null : Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option value="">Saved Queries</option>
                  {savedQueries.map((q, i) => <option key={i} value={i}>{q.name}</option>)}
                </select>
                <button onClick={() => selectedSavedIndex !== null && applySavedQuery(selectedSavedIndex)} className="px-2 py-1 bg-[#1f6f5f] text-white rounded text-sm">Apply</button>
                <button onClick={() => selectedSavedIndex !== null && startEditSaved(selectedSavedIndex)} className="px-2 py-1 border rounded text-sm">Edit</button>
                <button onClick={() => selectedSavedIndex !== null && deleteSavedQuery(selectedSavedIndex)} className="px-2 py-1 text-sm text-red-600">Delete</button>
              </div>
            )}

            {statusMsg && <div className="text-sm text-green-700 ml-3">{statusMsg}</div>}
          </div>

          {/* Save As Modal */}
          <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
            <DialogContent className="bg-white rounded-[12px] w-full max-w-md">
              <DialogHeader>
                <DialogTitle>Simpan Query</DialogTitle>
                <DialogDescription>Berikan nama untuk menyimpan filter dan pencarian saat ini.</DialogDescription>
              </DialogHeader>
              <div className="p-4">
                <label className="block text-sm text-slate-700 mb-2">Nama Query</label>
                <input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Contoh: Riwayat Hari Ini"
                  className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <DialogFooter>
                <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 border rounded">Batal</button>
                <button onClick={() => handleConfirmSave()} className="px-4 py-2 bg-[#1f6f5f] text-white rounded">Simpan</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <select title="Filter Pengguna"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="bg-white border border-gray-300 rounded-[5px] px-2 py-2 font-['Mukta'] text-[13px] text-gray-700 outline-none cursor-pointer w-[150px]"
            >
              <option>Pengguna</option>
              {userOptions.map((user) => (
                <option key={user}>{user}</option>
              ))}
            </select>

            <select title="Filter Peran"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-white border border-gray-300 rounded-[5px] px-2 py-2 font-['Mukta'] text-[13px] text-gray-700 outline-none cursor-pointer w-[155px]"
            >
              <option>Peran</option>
              <option>Administrasi Klaim</option>
              <option>Petugas Puskesmas</option>
            </select>

            <select title="Filter Kegiatan"
              value={filterKegiatan}
              onChange={(e) => setFilterKegiatan(e.target.value)}
              className="bg-white border border-gray-300 rounded-[5px] px-2 py-2 font-['Mukta'] text-[13px] text-gray-700 outline-none cursor-pointer w-[100px]"
            >
              <option>Kegiatan</option>
              <option>Masuk</option>
              <option>Unggah</option>
              <option>Analisis</option>
              <option>Update</option>
              <option>Delete</option>
              <option>View</option>
            </select>

            <select title="Filter Jangka Waktu"
              value={filterWaktu}
              onChange={(e) => setFilterWaktu(e.target.value)}
              className="bg-white border border-gray-300 rounded-[5px] px-2 py-2 font-['Mukta'] text-[13px] text-gray-700 outline-none cursor-pointer w-[120px]"
            >
              <option>Jangka Waktu</option>
              <option>Hari Ini</option>
              <option>Minggu Ini</option>
              <option>Bulan Ini</option>
            </select>

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-[5px] pl-8 pr-3 py-2 font-['Mukta'] text-[13px] text-gray-700 outline-none"
              />
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[10px] overflow-hidden">
            {/* Table Header */}
            <div className="bg-white border-b border-gray-300 flex py-3 px-4 gap-3">
              <div className="w-36 text-black font-['Mukta'] font-medium text-[14px]">Waktu</div>
              <div className="w-32 text-black font-['Mukta'] font-medium text-[14px]">Pengguna</div>
              <div className="w-40 text-black font-['Mukta'] font-medium text-[14px]">Peran</div>
              <div className="w-24 text-black font-['Mukta'] font-medium text-[14px]">Aksi</div>
              <div className="w-28 text-black font-['Mukta'] font-medium text-[14px]">Kategori</div>
              <div className="flex-1 min-w-[220px] text-black font-['Mukta'] font-medium text-[14px]">Pesan</div>
            </div>

            {/* Table Body */}
            {filteredData.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 font-['Mukta'] text-[16px]">Tidak ada data yang sesuai dengan filter</p>
              </div>
            ) : (
              filteredData.map((item, index) => (
              <div
                key={index}
                className="border-b border-gray-200 flex py-3 px-4 gap-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-36 flex flex-col justify-center">
                  <span className="font-['Mukta'] text-[13px] text-black">{(item.waktu || '').split(', ')[0]}</span>
                  <span className="font-['Mukta'] text-[12px] text-gray-600">{(item.waktu || '').split(', ')[1] ?? ''}</span>
                </div>
                <div className="w-32 flex items-center">
                  <span className="font-['Mukta'] text-[13px] text-black truncate">{item.user}</span>
                </div>
                <div className="w-40 flex items-center">
                  <span className="font-['Mukta'] text-[13px] text-black">{item.role}</span>
                </div>
                <div className="w-20 flex items-center">
                  <span className="font-['Mukta'] text-[13px] text-black truncate">{item.action}</span>
                </div>
                <div className="w-24 flex items-center">
                  <span className="font-['Mukta'] text-[13px] text-black truncate">{item.kategori}</span>
                </div>
                <div className="flex-1 min-w-[250px] flex items-center">
                  <span className="font-['Mukta'] text-[13px] text-black">{item.pesan}</span>
                </div>
              </div>
              ))
            )}
          </div>
    </>
  );
}
