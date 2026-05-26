import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, clearCurrentUser } from '../utils/userData';
import Group284 from '../../imports/Group284/Group284';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface SidebarProps {
  avatarSrc: string;
}

export default function Sidebar({ avatarSrc }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifikasiExpanded, setIsVerifikasiExpanded] = useState(true);
  const [isPengaturanExpanded, setIsPengaturanExpanded] = useState(true);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const isPath = (path: string) => location.pathname === path;
  const isGroupPath = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const menuItems = [
    { path: '/beranda', label: 'Beranda' },
    { path: '/laporan', label: 'Laporan' },
    { path: '/riwayat', label: 'Riwayat' },
  ];

  const verifikasiChildren = [
    { path: '/verifikasi-berkas', label: 'Lihat Berkas' },
    { path: '/unggah-berkas', label: 'Unggah Berkas' },
  ];

  const pengaturanChildren = [
    { path: '/pengaturan', label: 'Profil Pengguna' },
    ...(currentUser?.role === 'Administrasi Klaim'
      ? [{ path: '/pengaturan/pengguna', label: 'Manajemen Pengguna' }]
      : []),
    { path: '/pengaturan/tampilan', label: 'Tampilan' },
    { path: '/pengaturan/notifikasi', label: 'Notifikasi' },
    { path: '/pengaturan/keamanan', label: 'Keamanan' },
  ];

  const filterByQuery = (label: string) => normalizedSearch === '' || label.toLowerCase().includes(normalizedSearch);

  const filteredMenuItems = menuItems.filter((item) => filterByQuery(item.label));

  const verifikasiLabelMatches = filterByQuery('Verifikasi Berkas');
  const filteredVerifikasiChildren = verifikasiLabelMatches
    ? verifikasiChildren
    : verifikasiChildren.filter((item) => filterByQuery(item.label));
  const showVerifikasiGroup = normalizedSearch === '' || verifikasiLabelMatches || filteredVerifikasiChildren.length > 0;
  const isVerifikasiOpen = normalizedSearch !== '' ? showVerifikasiGroup : isVerifikasiExpanded;

  const pengaturanLabelMatches = filterByQuery('Pengaturan');
  const filteredPengaturanChildren = pengaturanLabelMatches
    ? pengaturanChildren
    : pengaturanChildren.filter((item) => filterByQuery(item.label));
  const showPengaturanGroup = normalizedSearch === '' || pengaturanLabelMatches || filteredPengaturanChildren.length > 0;
  const isPengaturanOpen = normalizedSearch !== '' ? showPengaturanGroup : isPengaturanExpanded;

  const firstSearchResultPath =
    filteredMenuItems.length > 0
      ? filteredMenuItems[0].path
      : filteredVerifikasiChildren.length > 0
      ? filteredVerifikasiChildren[0].path
      : filteredPengaturanChildren.length > 0
      ? filteredPengaturanChildren[0].path
      : null;

  const handleLogout = () => {
    clearCurrentUser();
    window.dispatchEvent(new Event('user-logout'));
    navigate('/');
    setIsLogoutDialogOpen(false);
  };

  const sidebarItem = (path: string, label: string) => (
    <div
      onClick={() => navigate(path)}
      className={`group flex items-center px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition-all duration-200 ease-out active:scale-[0.98] active:bg-white active:bg-opacity-10 ${
        isPath(path) ? 'bg-white bg-opacity-10' : 'hover:bg-white hover:bg-opacity-10'
      }`}
    >
      <p className={`font-['Mukta'] text-[15px] ${isPath(path) ? 'text-black font-semibold' : 'text-white group-hover:text-black'}`}>
        {label}
      </p>
    </div>
  );

  const subItem = (path: string, label: string) => (
    <div
      onClick={() => navigate(path)}
      className={`group flex items-center px-3 py-2 rounded-lg cursor-pointer mb-0.5 transition-all duration-200 ease-out active:scale-[0.98] active:bg-white active:bg-opacity-10 ${
        isPath(path) ? 'bg-white bg-opacity-10' : 'hover:bg-white hover:bg-opacity-10'
      }`}
    >
      {isPath(path) && <div className="w-1 h-4 bg-white rounded-full mr-2 flex-shrink-0" />}
      <p className={`font-['Mukta'] text-[13px] ${isPath(path) ? 'text-black font-semibold' : 'text-white opacity-80 group-hover:text-black group-hover:opacity-100'}`}>
        {label}
      </p>
    </div>
  );

  return (
    <div className="w-64 bg-[#1f6f5f] flex flex-col flex-shrink-0 shadow-xl">
      <div className="h-[53px] bg-[#d9ece3] flex items-center px-4 flex-shrink-0">
        <div className="h-[37px] w-[138px]">
          <Group284 />
        </div>
      </div>
      <div className="p-4 border-b border-white border-opacity-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={avatarSrc} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#37E320] rounded-full border-2 border-[#1f6f5f]" />
          </div>
          <div>
            <p className="text-white font-['Mukta'] text-[15px] font-medium">{currentUser?.nama || 'Pengguna'}</p>
            <p className="text-white text-[11px] font-['Mukta'] opacity-80">Online</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="bg-white bg-opacity-10 rounded-[20px] px-4 py-2 flex items-center gap-2 transition-all duration-200">
          <svg className="w-4 h-4 text-black opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && firstSearchResultPath) {
                navigate(firstSearchResultPath);
              }
            }}
            placeholder="Cari..."
            className="bg-transparent border-none outline-none text-[13px] font-['Lexend'] font-bold text-black opacity-90 w-full placeholder-black"
          />
        </div>
      </div>
      <nav className="flex-1 px-3 overflow-y-auto text-white">
        {filteredMenuItems.map((item) => (
          <div key={item.path}>{sidebarItem(item.path, item.label)}</div>
        ))}

        {showVerifikasiGroup && (
          <div className="mb-1">
            <div
              onClick={() => setIsVerifikasiExpanded((prev) => !prev)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] active:bg-white active:bg-opacity-10 ${
                isGroupPath('/verifikasi-berkas') ? 'bg-white bg-opacity-10' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <p className={`font-['Mukta'] text-[15px] ${isGroupPath('/verifikasi-berkas') ? 'text-black font-semibold' : 'text-white group-hover:text-black'}`}>
                Verifikasi Berkas
              </p>
              <svg
                className={`w-4 h-4 text-white transition-transform duration-200 ${isVerifikasiOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className={`overflow-hidden transition-all duration-200 ${isVerifikasiOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="ml-4 mt-1 space-y-1">
                {filteredVerifikasiChildren.map((item) => (
                  <div key={item.path}>{subItem(item.path, item.label)}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showPengaturanGroup && (
          <div className="mb-1">
            <div
              onClick={() => setIsPengaturanExpanded((prev) => !prev)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] active:bg-white active:bg-opacity-10 ${
                isGroupPath('/pengaturan') ? 'bg-white bg-opacity-10' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <p className={`font-['Mukta'] text-[15px] ${isGroupPath('/pengaturan') ? 'text-black font-semibold' : 'text-white group-hover:text-black'}`}>
                Pengaturan
              </p>
              <svg
                className={`w-4 h-4 text-white transition-transform duration-200 ${isPengaturanOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className={`overflow-hidden transition-all duration-200 ${isPengaturanOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="ml-4 mt-1 space-y-0.5">
                {filteredPengaturanChildren.map((item) => (
                  <div key={item.path}>{subItem(item.path, item.label)}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
      <div className="px-3 pb-4">
        <button
          type="button"
          onClick={() => setIsLogoutDialogOpen(true)}
          className="group w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ease-out active:scale-[0.98] active:bg-white active:bg-opacity-10 hover:bg-white hover:bg-opacity-10"
        >
          <svg className="w-4 h-4 mr-3 text-white group-hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          <span className="font-['Mukta'] text-[15px] text-white group-hover:text-black">Logout</span>
        </button>
      </div>
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle>Konfirmasi Logout</DialogTitle>
            <DialogDescription>Anda akan keluar dari akun ini. Pastikan semua pekerjaan tersimpan sebelum melanjutkan.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Apakah Anda yakin ingin logout sekarang?
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-lg bg-[#1f6f5f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#175145]"
            >
              Logout
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
