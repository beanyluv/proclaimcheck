import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import BerandaPage from './pages/BerandaPage';
import VerifikasiBerkasPage from './pages/VerifikasiBerkasPage';
import UnggahBerkasPage from './pages/UnggahBerkasPage';
import LaporanPage from './pages/LaporanPage';
import RiwayatPage from './pages/RiwayatPage';
import PengaturanPage from './pages/PengaturanPage';
import ManajemenPenggunaPage from './pages/ManajemenPenggunaPage';
import { getCurrentUser } from './utils/userData';
import SettingsProvider from './components/SettingsProvider';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => { const user = getCurrentUser(); setIsAuthenticated(!!user); };
    checkAuth();
    const handleLogout = () => setIsAuthenticated(false);
    window.addEventListener('user-logout', handleLogout);
    window.addEventListener('focus', checkAuth);
    return () => { window.removeEventListener('user-logout', handleLogout); window.removeEventListener('focus', checkAuth); };
  }, []);

  const currentUser = getCurrentUser();
  const isAdmin = isAuthenticated && currentUser?.role === 'Administrasi Klaim';

  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/beranda" element={isAuthenticated ? <BerandaPage /> : <Navigate to="/" replace />} />
          <Route path="/verifikasi-berkas" element={isAuthenticated ? <VerifikasiBerkasPage /> : <Navigate to="/" replace />} />
          <Route path="/unggah-berkas" element={isAuthenticated ? <UnggahBerkasPage /> : <Navigate to="/" replace />} />
          <Route path="/laporan" element={isAuthenticated ? <LaporanPage /> : <Navigate to="/" replace />} />
          <Route path="/riwayat" element={isAuthenticated ? <RiwayatPage /> : <Navigate to="/" replace />} />
          <Route path="/pengaturan" element={isAuthenticated ? <PengaturanPage /> : <Navigate to="/" replace />} />
          {/* ✅ Route baru untuk Manajemen Pengguna (admin only) */}
          <Route path="/pengaturan/pengguna" element={isAdmin ? <ManajemenPenggunaPage /> : <Navigate to="/pengaturan" replace />} />
          <Route path="/pengaturan/tampilan" element={isAuthenticated ? <PengaturanPage /> : <Navigate to="/" replace />} />
          <Route path="/pengaturan/notifikasi" element={isAuthenticated ? <PengaturanPage /> : <Navigate to="/" replace />} />
          <Route path="/pengaturan/keamanan" element={isAuthenticated ? <PengaturanPage /> : <Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
