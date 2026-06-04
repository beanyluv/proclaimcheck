import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import defaultAvatar from '../../imports/Frame271-1/ecd5bb1c63617aeaceefdae80e49afd2e592d178.png';
import { getCurrentUser } from '../utils/userData';

export default function MainLayout() {
  const currentUser = getCurrentUser();
  const location = useLocation();

  // Mapping paths to clean titles in Indonesian
  const getPageTitle = (path: string): string => {
    if (path.startsWith('/beranda')) return 'Beranda';
    if (path.startsWith('/verifikasi-berkas')) {
      return currentUser?.role === 'Petugas Puskesmas' ? 'Status Kelayakan' : 'Verifikasi Berkas';
    }
    if (path.startsWith('/unggah-berkas')) return 'Unggah Berkas';
    if (path.startsWith('/laporan')) return 'Laporan';
    if (path.startsWith('/riwayat')) return 'Aktivitas Masuk';
    if (path.startsWith('/pengaturan/pengguna')) return 'Manajemen Pengguna';
    if (path.startsWith('/pengaturan')) return 'Pengaturan';
    return 'ProClaim Check';
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Rendered once, prevents re-render! */}
      <Sidebar avatarSrc={defaultAvatar} />

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar - Rendered once, updates title dynamically! */}
        <TopBar 
          title={getPageTitle(location.pathname)} 
          avatarSrc={defaultAvatar} 
          userName={currentUser?.nama} 
        />

        {/* Content Wrapper for all child pages */}
        <div className="flex-1 bg-[#eee] bg-opacity-70 overflow-y-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
