import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/userData';
import imgImage3 from "figma:asset/ecd5bb1c63617aeaceefdae80e49afd2e592d178.png";
import svgPaths from "../../imports/svg-lifwh827ae";
import Group284 from "../../imports/Group284/Group284";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export default function Layout({ children, currentPage }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [isVerifikasiExpanded, setIsVerifikasiExpanded] = useState(true);

  const isActive = (path: string) => location.pathname === path;

  // Base nav button classes with smooth transition
  const navBtn = (path: string) =>
    `w-full px-8 py-4 text-left font-['Mukta'] text-[17px] font-medium
     transition-all duration-200 ease-in-out
     relative overflow-hidden group
     ${isActive(path)
       ? 'bg-[#eee] text-black shadow-inner'
       : 'text-white hover:bg-[rgba(255,255,255,0.15)] active:bg-[rgba(255,255,255,0.25)] active:scale-[0.98]'}`;

  const subNavBtn = (path: string) =>
    `w-full px-8 py-3 text-left font-['Mukta'] text-[15px] font-medium
     transition-all duration-200 ease-in-out
     ${isActive(path)
       ? 'bg-[rgba(255,255,255,0.25)] text-white font-semibold pl-10'
       : 'text-white hover:bg-[rgba(255,255,255,0.12)] hover:pl-10 active:bg-[rgba(255,255,255,0.2)]'}`;

  return (
    <div className="min-h-screen w-full bg-[#fafafa]">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-[#d9ece3] h-[53px] flex items-center justify-between px-6 z-40">
        {/* Logo */}
        <div className="h-[37px] w-[138px]">
          <Group284 />
        </div>

        {/* Right side - User info and notifications */}
        <div className="flex items-center gap-5">
          {/* Search */}
          <div className="bg-[#fff7f7] opacity-50 rounded-[20px] h-[38px] w-[240px] flex items-center px-4 gap-3 hover:opacity-70 transition-opacity cursor-pointer">
            <div className="w-[20px] h-[20px] flex-shrink-0">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.75 22.75">
                <path d={svgPaths.p1acdaa70} stroke="#1E1E1E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari..."
              className="bg-transparent outline-none font-['Lexend'] font-bold text-[13px] text-black flex-1 w-full"
            />
          </div>

          {/* Mail icon with badge */}
          <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-[24px] h-[24px]">
              <svg className="block size-full" fill="none" viewBox="0 0 26.5536 21.6429">
                <path d={svgPaths.p3d4f7800} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 bg-[#FB4A4A] rounded-full w-[16px] h-[16px] flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">6</span>
            </div>
          </div>

          {/* Notification icon with badge */}
          <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-[24px] h-[24px]">
              <svg className="block size-full" fill="none" viewBox="0 0 22.2219 27.4883">
                <path d={svgPaths.p5d7c900} fill="black" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 bg-[#FB4A4A] rounded-full w-[16px] h-[16px] flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">3</span>
            </div>
          </div>

          {/* User profile */}
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mr-2">
            <img alt="Profile" className="w-[36px] h-[36px] rounded-full object-cover border-2 border-[rgba(0,0,0,0.1)] shadow-sm" src={imgImage3} />
            <span className="font-['Mukta'] text-[16px] font-medium text-black">{currentUser?.nama || 'Pengguna'}</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-[53px] w-[280px] h-[calc(100vh-53px)] bg-[#1f6f5f] z-30 overflow-hidden">
        {/* User info in sidebar */}
        <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.15)]">
          <div className="flex items-center gap-3">
            <img alt="Profile" className="w-[42px] h-[42px] rounded-full object-cover border-2 border-[rgba(255,255,255,0.2)] shadow-md" src={imgImage3} />
            <div>
              <p className="font-['Mukta'] text-[16px] font-medium text-white leading-tight">{currentUser?.nama || 'Pengguna'}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-[10px] h-[10px] bg-[#37E320] rounded-full shadow-sm"></div>
                <p className="font-['Mukta'] text-[12px] text-white opacity-90">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search in sidebar */}
        <div className="px-5 py-3">
          <div className="bg-[rgba(255,255,255,0.12)] rounded-[20px] h-[38px] flex items-center px-4 gap-2 focus-within:bg-[rgba(255,255,255,0.18)] transition-all duration-200">
            <svg className="w-4 h-4 text-white opacity-60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari..."
              className="bg-transparent outline-none font-['Mukta'] text-[13px] text-white placeholder-white placeholder-opacity-50 flex-1"
            />
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="mt-2">
          {/* Beranda */}
          <button
            onClick={() => navigate('/beranda')}
            className={navBtn('/beranda')}
          >
            {isActive('/beranda') && (
              <span className="absolute left-0 top-0 h-full w-1 bg-[#37E320] rounded-r-full" />
            )}
            Beranda
          </button>

          {/* Verifikasi Berkas with Submenu */}
          <div>
            <button
              onClick={() => setIsVerifikasiExpanded(!isVerifikasiExpanded)}
              className={`w-full px-8 py-4 text-left font-['Mukta'] text-[17px] font-medium
                transition-all duration-200 ease-in-out flex items-center justify-between relative
                ${isActive('/verifikasi-berkas') || isActive('/unggah-berkas')
                  ? 'bg-[#eee] text-black'
                  : 'text-white hover:bg-[rgba(255,255,255,0.15)] active:bg-[rgba(255,255,255,0.25)]'}`}
            >
              {(isActive('/verifikasi-berkas') || isActive('/unggah-berkas')) && (
                <span className="absolute left-0 top-0 h-full w-1 bg-[#37E320] rounded-r-full" />
              )}
              <span>Verifikasi Berkas</span>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ease-in-out ${isVerifikasiExpanded ? 'rotate-180' : 'rotate-0'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Submenu with smooth animation */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: isVerifikasiExpanded ? '200px' : '0px', opacity: isVerifikasiExpanded ? 1 : 0 }}
            >
              <div className="ml-4 mt-1 space-y-1 pb-1">
                <button
                  onClick={() => navigate('/verifikasi-berkas')}
                  className={subNavBtn('/verifikasi-berkas')}
                >
                  Lihat Berkas
                </button>
                <button
                  onClick={() => navigate('/unggah-berkas')}
                  className={subNavBtn('/unggah-berkas')}
                >
                  Unggah Berkas
                </button>
              </div>
            </div>
          </div>

          {/* Laporan */}
          <button
            onClick={() => navigate('/laporan')}
            className={navBtn('/laporan')}
          >
            {isActive('/laporan') && (
              <span className="absolute left-0 top-0 h-full w-1 bg-[#37E320] rounded-r-full" />
            )}
            Laporan
          </button>

          {/* Riwayat */}
          <button
            onClick={() => navigate('/riwayat')}
            className={navBtn('/riwayat')}
          >
            {isActive('/riwayat') && (
              <span className="absolute left-0 top-0 h-full w-1 bg-[#37E320] rounded-r-full" />
            )}
            Riwayat
          </button>

          {/* Pengaturan */}
          <button
            onClick={() => navigate('/pengaturan')}
            className={navBtn('/pengaturan')}
          >
            {isActive('/pengaturan') && (
              <span className="absolute left-0 top-0 h-full w-1 bg-[#37E320] rounded-r-full" />
            )}
            Pengaturan
          </button>
        </nav>
      </div>

      {/* Main content area */}
      <div className="ml-[280px] mt-[53px] min-h-[calc(100vh-53px)]">
        {/* Page title bar */}
        <div className="bg-[#eee] opacity-70 h-[55px] flex items-center px-8">
          <p className="font-['Mukta'] text-[22px] font-medium text-[#a8a8a8]">{currentPage}</p>
        </div>

        {/* Page content */}
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  );
}
