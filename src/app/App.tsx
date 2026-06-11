import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, updateSessionActivity } from './utils/userData';
import SettingsProvider from './components/SettingsProvider';
import { getSubdomainInfo, navigateWithSubdomain, isSubdomainRoutingEnabled } from './utils/subdomain';

// Lazy load pages for efficient route-based code-splitting
const MainLayout = React.lazy(() => import('./components/MainLayout'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const BerandaPage = React.lazy(() => import('./pages/BerandaPage'));
const VerifikasiBerkasPage = React.lazy(() => import('./pages/VerifikasiBerkasPage'));
const UnggahBerkasPage = React.lazy(() => import('./pages/UnggahBerkasPage'));
const LaporanPage = React.lazy(() => import('./pages/LaporanPage'));
const RiwayatPage = React.lazy(() => import('./pages/RiwayatPage'));
const PengaturanPage = React.lazy(() => import('./pages/PengaturanPage'));
const ManajemenPenggunaPage = React.lazy(() => import('./pages/ManajemenPenggunaPage'));

const LoadingFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-[#f7faf8]">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1f6f5f] border-t-transparent"></div>
      <p className="font-['Mukta'] text-[15px] font-semibold text-[#1f6f5f]">Memuat Halaman...</p>
    </div>
  </div>
);

// Intercepts path requests and enforces subdomain routing scopes
function SubdomainRedirector() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) return;
    if (!isSubdomainRoutingEnabled()) return;

    const { subdomain, targetPath } = getSubdomainInfo();
    const currentPath = location.pathname;

    // 1. Root redirect based on subdomain
    if (subdomain && (currentPath === '/' || currentPath === '/beranda') && targetPath) {
      navigate(targetPath, { replace: true });
      return;
    }

    // 2. Redirect to correct subdomain if route scope doesn't match the current subdomain
    let pathSubdomain = '';
    if (currentPath.startsWith('/unggah-berkas')) {
      pathSubdomain = 'unggah';
    } else if (currentPath.startsWith('/verifikasi-berkas')) {
      pathSubdomain = 'analisis';
    } else if (currentPath.startsWith('/laporan')) {
      pathSubdomain = 'pelaporan';
    } else if (currentPath.startsWith('/riwayat')) {
      pathSubdomain = 'riwayat';
    }

    if (pathSubdomain && pathSubdomain !== subdomain) {
      navigateWithSubdomain(currentPath);
    }
  }, [location.pathname, currentUser, navigate]);

  return null;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!getCurrentUser();
  });

  useEffect(() => {
    const checkAuth = () => { 
      const user = getCurrentUser(); 
      setIsAuthenticated(!!user); 
    };
    checkAuth();

    // Throttled activity updater
    let lastActivityUpdate = 0;
    const throttledUpdateActivity = () => {
      const now = Date.now();
      if (now - lastActivityUpdate > 10000) { // at most once every 10 seconds
        lastActivityUpdate = now;
        updateSessionActivity();
      }
    };

    // Add activity listeners
    window.addEventListener('mousemove', throttledUpdateActivity);
    window.addEventListener('keydown', throttledUpdateActivity);
    window.addEventListener('click', throttledUpdateActivity);
    window.addEventListener('scroll', throttledUpdateActivity);

    // Periodic checking (every 10 seconds)
    const checkInterval = setInterval(() => {
      const user = getCurrentUser(); // This triggers the 2-hour inactivity logout and 'user-logout' event automatically
      if (!user) {
        setIsAuthenticated(false);
      }
    }, 10000);

    const handleLogout = () => setIsAuthenticated(false);
    window.addEventListener('user-logout', handleLogout);
    window.addEventListener('focus', checkAuth);

    return () => {
      window.removeEventListener('user-logout', handleLogout);
      window.removeEventListener('focus', checkAuth);
      window.removeEventListener('mousemove', throttledUpdateActivity);
      window.removeEventListener('keydown', throttledUpdateActivity);
      window.removeEventListener('click', throttledUpdateActivity);
      window.removeEventListener('scroll', throttledUpdateActivity);
      clearInterval(checkInterval);
    };
  }, []);

  const currentUser = getCurrentUser();
  const isAdmin = isAuthenticated && currentUser?.role === 'Administrasi Klaim';

  return (
    <SettingsProvider>
      <BrowserRouter>
        <SubdomainRedirector />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />
            
            {/* Wrap authenticated routes inside MainLayout */}
            <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/" replace />}>
              <Route path="/beranda" element={<BerandaPage />} />
              <Route path="/verifikasi-berkas" element={<VerifikasiBerkasPage />} />
              <Route path="/unggah-berkas" element={<UnggahBerkasPage />} />
              <Route path="/laporan" element={<LaporanPage />} />
              <Route path="/riwayat" element={<RiwayatPage />} />
              <Route path="/pengaturan" element={<PengaturanPage />} />
              {/* ✅ Route baru untuk Manajemen Pengguna (admin only) */}
              <Route path="/pengaturan/pengguna" element={isAdmin ? <ManajemenPenggunaPage /> : <Navigate to="/pengaturan" replace />} />
              <Route path="/pengaturan/tampilan" element={<PengaturanPage />} />
              <Route path="/pengaturan/notifikasi" element={<PengaturanPage />} />
              <Route path="/pengaturan/keamanan" element={<PengaturanPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SettingsProvider>
  );
}

