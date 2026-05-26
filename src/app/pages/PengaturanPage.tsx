import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import imgImage3 from '../../imports/PengaturanProclaimCheck/ecd5bb1c63617aeaceefdae80e49afd2e592d178.png';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getCurrentUser, updateUserProfile, changePassword, setCurrentUser, clearCurrentUser } from '../utils/userData';
import { getSettings, updateSetting } from '../utils/settingsData';
import { getUsersFromServer, updateUserOnServer } from '../utils/serverApi';
import Group284 from "../../imports/Group284/Group284";

export default function PengaturanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const getActiveTabFromPath = (path: string) => {
    if (path.startsWith('/pengaturan/tampilan')) return 'tampilan';
    if (path.startsWith('/pengaturan/notifikasi')) return 'notifikasi';
    if (path.startsWith('/pengaturan/keamanan')) return 'keamanan';
    if (path.startsWith('/pengaturan/sistem')) return 'sistem';
    if (path === '/pengaturan') return 'profil';
    return 'profil';
  };
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath(location.pathname));
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);
  const [notifSound, setNotifSound] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [isVerifikasiExpanded, setIsVerifikasiExpanded] = useState(true);

  // Load settings from localStorage
  const [appSettings, setAppSettings] = useState(getSettings());

  // Profile form state
  const [profileData, setProfileData] = useState({
    nama: '',
    username: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  // Website settings state
  const [websiteData, setWebsiteData] = useState({
    namaWebsite: 'Proclaim Check',
    deskripsi: 'Sistem Verifikasi Berkas BPJS',
    kontak: '+62 812-3456-7890',
    alamat: 'Jakarta, Indonesia',
    bahasa: 'id',
    zonaWaktu: 'Asia/Jakarta',
  });

  const [previewImage, setPreviewImage] = useState(imgImage3);

  // Load current user data on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserState(user);
      setProfileData({
        nama: user.nama,
        username: user.username,
        email: user.email,
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      if (user.foto) {
        setPreviewImage(user.foto);
      }
    }
  }, []);

  useEffect(() => {
    setActiveTab(getActiveTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData({ ...profileData, [field]: value });
  };

  const handleWebsiteUpdate = (field: string, value: string) => {
    setWebsiteData({ ...websiteData, [field]: value });
  };

  const handleSettingToggle = (key: keyof typeof appSettings) => {
    const currentValue = appSettings[key];
    const newSettings = updateSetting(key, !currentValue as any);
    setAppSettings(newSettings);
  };

  const handleSettingChange = (key: keyof typeof appSettings, value: any) => {
    const newSettings = updateSetting(key, value);
    setAppSettings(newSettings);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    const updates = {
      nama: profileData.nama,
      username: profileData.username,
      email: profileData.email,
      foto: previewImage !== imgImage3 ? previewImage : undefined,
    };

    try {
      const updatedUser = await updateUserOnServer(currentUser.id, updates);
      setCurrentUser(updatedUser);
      setCurrentUserState(updatedUser);
      setSaveMessage('Profil berhasil diperbarui');
      setSaveError('');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.warn('Server update profile gagal, fallback ke local', error);
      const success = updateUserProfile(currentUser.id, updates);
      if (success) {
        const updatedUser = getCurrentUser();
        if (updatedUser) {
          setCurrentUserState(updatedUser);
        }
        setSaveMessage('Profil berhasil diperbarui');
        setSaveError('');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveError('Gagal memperbarui profil');
        setSaveMessage('');
        setTimeout(() => setSaveError(''), 3000);
      }
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;

    // Validation
    if (!profileData.oldPassword || !profileData.newPassword || !profileData.confirmPassword) {
      setSaveError('Harap isi semua field password');
      setSaveMessage('');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }

    if (profileData.newPassword !== profileData.confirmPassword) {
      setSaveError('Password baru dan konfirmasi password tidak sama');
      setSaveMessage('');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }

    if (profileData.newPassword.length < 6) {
      setSaveError('Password baru minimal 6 karakter');
      setSaveMessage('');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }

    try {
      const serverUsers = await getUsersFromServer();
      const serverUser = serverUsers.find((u) => u.id === currentUser.id);

      if (!serverUser) {
        throw new Error('User tidak ditemukan di server');
      }

      if (serverUser.password !== profileData.oldPassword) {
        throw new Error('Password lama salah');
      }

      const updatedUser = await updateUserOnServer(currentUser.id, { password: profileData.newPassword });
      setCurrentUser(updatedUser);
      setSaveMessage('Password berhasil diubah');
      setSaveError('');
      setProfileData({
        ...profileData,
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      console.warn('Server change password gagal, fallback ke local', error);
      const result = changePassword(currentUser.id, profileData.oldPassword, profileData.newPassword);

      if (result.success) {
        setSaveMessage(result.message);
        setSaveError('');
        setProfileData({
          ...profileData,
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveError(result.message || 'Gagal mengubah password');
        setSaveMessage('');
        setTimeout(() => setSaveError(''), 3000);
      }
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    // Dispatch custom event to notify App.tsx about logout
    window.dispatchEvent(new Event('user-logout'));
    navigate('/');
  };

  const tabs = [
    { id: 'profil', name: 'Profil Pengguna' },
    { id: 'tampilan', name: 'Tampilan' },
    { id: 'notifikasi', name: 'Notifikasi' },
    { id: 'keamanan', name: 'Keamanan' },
    { id: 'sistem', name: 'Sistem' },
    { id: 'logout', name: 'Logout' },
  ];

  const loginHistory = [
    { device: 'Chrome on Windows', location: 'Jakarta, Indonesia', time: '2026-05-19 14:30', status: 'Aktif' },
    { device: 'Firefox on MacOS', location: 'Bandung, Indonesia', time: '2026-05-18 09:15', status: 'Selesai' },
    { device: 'Safari on iPhone', location: 'Surabaya, Indonesia', time: '2026-05-17 20:45', status: 'Selesai' },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar avatarSrc={imgImage3} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Pengaturan" avatarSrc={previewImage} userName={currentUser?.nama} />

        {/* Content Area */}
        <div className="flex-1 bg-[#eee] bg-opacity-70 dark:bg-gray-900 overflow-y-auto p-6">
            {/* Profil Pengguna */}
            {activeTab === 'profil' && (
              <div className="max-w-4xl">
                <h2 className="text-[24px] font-['Mukta'] font-medium text-gray-800 dark:text-white mb-6">Profil Pengguna</h2>

                {/* Success/Error Messages */}
                {saveMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-700 font-['Mukta'] text-[14px]">{saveMessage}</p>
                  </div>
                )}
                {saveError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-700 font-['Mukta'] text-[14px]">{saveError}</p>
                  </div>
                )}

                {/* Photo Upload */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Foto Profil</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <img src={previewImage} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-[#1f6f5f]" />
                      <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                    <div>
                      <label className="bg-[#1f6f5f] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#175a4d] transition-colors font-['Mukta'] text-[14px] inline-block">
                        Upload Foto
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <p className="text-gray-500 text-[12px] font-['Mukta'] mt-2">JPG, PNG atau GIF (Max. 2MB)</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Informasi Pribadi</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
                      <input
                        type="text"
                        value={profileData.nama}
                        onChange={(e) => handleProfileUpdate('nama', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Username</label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => handleProfileUpdate('username', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileUpdate('email', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    className="mt-4 bg-[#1f6f5f] text-white px-6 py-2 rounded-lg hover:bg-[#175a4d] transition-colors font-['Mukta'] text-[14px]"
                  >
                    Simpan Perubahan
                  </button>
                </div>

                {/* Change Password */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Ganti Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Password Lama</label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          value={profileData.oldPassword}
                          onChange={(e) => handleProfileUpdate('oldPassword', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showOldPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Password Baru</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={profileData.newPassword}
                          onChange={(e) => handleProfileUpdate('newPassword', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Konfirmasi Password Baru</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={profileData.confirmPassword}
                          onChange={(e) => handleProfileUpdate('confirmPassword', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="mt-4 bg-[#1f6f5f] text-white px-6 py-2 rounded-lg hover:bg-[#175a4d] transition-colors font-['Mukta'] text-[14px]"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {/* Tampilan */}
            {activeTab === 'tampilan' && (
              <div className="max-w-4xl">
                <h2 className="text-[24px] font-['Mukta'] font-medium text-gray-800 mb-6">Pengaturan Tampilan</h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Mode Tampilan</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[14px] font-['Mukta'] text-gray-700">Mode Gelap</p>
                      <p className="text-[12px] font-['Mukta'] text-gray-500">Aktifkan tampilan gelap untuk kenyamanan mata</p>
                    </div>
                    <button
                      onClick={() => handleSettingToggle('darkMode')}
                      className={`relative w-14 h-7 rounded-full transition-colors ${appSettings.darkMode ? 'bg-[#1f6f5f]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${appSettings.darkMode ? 'translate-x-7' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-['Mukta'] text-gray-700">Sidebar Minimalis</p>
                      <p className="text-[12px] font-['Mukta'] text-gray-500">Sembunyikan teks menu sidebar</p>
                    </div>
                    <button
                      onClick={() => handleSettingToggle('sidebarCollapsed')}
                      className={`relative w-14 h-7 rounded-full transition-colors ${appSettings.sidebarCollapsed ? 'bg-[#1f6f5f]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${appSettings.sidebarCollapsed ? 'translate-x-7' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Ukuran Font</h3>
                  <select
                    value={appSettings.fontSize}
                    onChange={(e) => handleSettingChange('fontSize', e.target.value as 'small' | 'medium' | 'large')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all"
                  >
                    <option value="small">Kecil</option>
                    <option value="medium">Sedang</option>
                    <option value="large">Besar</option>
                  </select>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 font-['Mukta'] text-sm">
                      Pratinjau: Perubahan ukuran font akan diterapkan ke seluruh aplikasi
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Preferensi Regional</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Bahasa</label>
                      <select
                        value={appSettings.bahasa}
                        onChange={(e) => handleSettingChange('bahasa', e.target.value as 'id' | 'en')}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Zona Waktu</label>
                      <select
                        value={appSettings.zonaWaktu}
                        onChange={(e) => handleSettingChange('zonaWaktu', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all"
                      >
                        <option value="Asia/Jakarta">WIB (Jakarta)</option>
                        <option value="Asia/Makassar">WITA (Makassar)</option>
                        <option value="Asia/Jayapura">WIT (Jayapura)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700 font-['Mukta'] text-sm">
                      ✓ Perubahan disimpan otomatis
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notifikasi */}
            {activeTab === 'notifikasi' && (
              <div className="max-w-4xl">
                <h2 className="text-[24px] font-['Mukta'] font-medium text-gray-800 mb-6">Pengaturan Notifikasi</h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Jenis Notifikasi</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-['Mukta'] text-gray-700">Notifikasi Email</p>
                        <p className="text-[12px] font-['Mukta'] text-gray-500">Terima notifikasi melalui email</p>
                      </div>
                      <button
                        onClick={() => setNotifEmail(!notifEmail)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${notifEmail ? 'bg-[#1f6f5f]' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${notifEmail ? 'translate-x-7' : ''}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-['Mukta'] text-gray-700">Notifikasi Sistem</p>
                        <p className="text-[12px] font-['Mukta'] text-gray-500">Notifikasi di dalam aplikasi</p>
                      </div>
                      <button
                        onClick={() => setNotifSystem(!notifSystem)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${notifSystem ? 'bg-[#1f6f5f]' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${notifSystem ? 'translate-x-7' : ''}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-['Mukta'] text-gray-700">Notifikasi Suara</p>
                        <p className="text-[12px] font-['Mukta'] text-gray-500">Mainkan suara untuk notifikasi</p>
                      </div>
                      <button
                        onClick={() => setNotifSound(!notifSound)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${notifSound ? 'bg-[#1f6f5f]' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${notifSound ? 'translate-x-7' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Frekuensi Notifikasi</h3>
                  <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all">
                    <option value="realtime">Real-time (Segera)</option>
                    <option value="hourly">Setiap Jam</option>
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                  </select>
                  <button className="mt-4 bg-[#1f6f5f] text-white px-6 py-2 rounded-lg hover:bg-[#175a4d] transition-colors font-['Mukta'] text-[14px]">
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            )}

            {/* Keamanan */}
            {activeTab === 'keamanan' && (
              <div className="max-w-4xl">
                <h2 className="text-[24px] font-['Mukta'] font-medium text-gray-800 mb-6">Keamanan</h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Autentikasi Dua Langkah</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[14px] font-['Mukta'] text-gray-700">Aktifkan 2FA</p>
                      <p className="text-[12px] font-['Mukta'] text-gray-500">Tambahkan lapisan keamanan ekstra untuk akun Anda</p>
                    </div>
                    <button
                      onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${twoFactorAuth ? 'bg-[#1f6f5f]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${twoFactorAuth ? 'translate-x-7' : ''}`} />
                    </button>
                  </div>
                  {twoFactorAuth && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-[14px] font-['Mukta'] text-green-800">2FA telah diaktifkan. Gunakan aplikasi authenticator untuk login.</p>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Riwayat Login</h3>
                  <div className="space-y-3">
                    {loginHistory.map((login, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1f6f5f] bg-opacity-10 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#1f6f5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[14px] font-['Mukta'] text-gray-800">{login.device}</p>
                            <p className="text-[12px] font-['Mukta'] text-gray-500">{login.location} • {login.time}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[12px] font-['Mukta'] ${
                          login.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {login.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Logout Semua Perangkat</h3>
                  <p className="text-[14px] font-['Mukta'] text-gray-600 mb-4">Keluar dari semua perangkat yang terhubung kecuali perangkat ini.</p>
                  <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-['Mukta'] text-[14px]">
                    Logout Semua Perangkat
                  </button>
                </div>
              </div>
            )}

            {/* Sistem */}
            {activeTab === 'sistem' && (
              <div className="max-w-4xl">
                <h2 className="text-[24px] font-['Mukta'] font-medium text-gray-800 mb-6">Pengaturan Sistem</h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Manajemen Data</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-['Mukta'] font-medium text-gray-800">Backup Data</p>
                        <p className="text-[12px] font-['Mukta'] text-gray-500">Cadangkan semua data</p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-['Mukta'] font-medium text-gray-800">Restore Data</p>
                        <p className="text-[12px] font-['Mukta'] text-gray-500">Pulihkan data backup</p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-['Mukta'] font-medium text-gray-800">Export Data</p>
                        <p className="text-[12px] font-['Mukta'] text-gray-500">Unduh data dalam CSV</p>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-['Mukta'] font-medium text-gray-800">Hapus Cache</p>
                        <p className="text-[12px] font-['Mukta'] text-gray-500">Bersihkan cache sistem</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Informasi Website</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Nama Website</label>
                      <input
                        type="text"
                        value={websiteData.namaWebsite}
                        onChange={(e) => handleWebsiteUpdate('namaWebsite', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Deskripsi</label>
                      <textarea
                        value={websiteData.deskripsi}
                        onChange={(e) => handleWebsiteUpdate('deskripsi', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Kontak</label>
                        <input
                          type="text"
                          value={websiteData.kontak}
                          onChange={(e) => handleWebsiteUpdate('kontak', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[14px] font-['Mukta'] text-gray-700 dark:text-gray-300 mb-2">Alamat</label>
                        <input
                          type="text"
                          value={websiteData.alamat}
                          onChange={(e) => handleWebsiteUpdate('alamat', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-['Mukta'] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <button className="mt-4 bg-[#1f6f5f] text-white px-6 py-2 rounded-lg hover:bg-[#175a4d] transition-colors font-['Mukta'] text-[14px]">
                    Simpan Perubahan
                  </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-[18px] font-['Mukta'] font-medium text-gray-800 mb-4">Informasi Sistem</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-[14px] font-['Mukta'] text-gray-600">Versi Aplikasi</span>
                      <span className="text-[14px] font-['Mukta'] font-medium text-gray-800">v1.0.0</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-[14px] font-['Mukta'] text-gray-600">Tanggal Rilis</span>
                      <span className="text-[14px] font-['Mukta'] font-medium text-gray-800">19 Mei 2026</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-[14px] font-['Mukta'] text-gray-600">Build Number</span>
                      <span className="text-[14px] font-['Mukta'] font-medium text-gray-800">#20260519</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[14px] font-['Mukta'] text-gray-600">Status Sistem</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[12px] font-['Mukta']">Aktif</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logout */}
            {activeTab === 'logout' && (
              <div className="max-w-4xl">
                <h2 className="text-[24px] font-['Mukta'] font-medium text-gray-800 mb-6">Logout</h2>

                <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[20px] font-['Mukta'] font-medium text-gray-800 mb-2">Logout dari Akun</h3>
                      <p className="text-[14px] font-['Mukta'] text-gray-600 mb-1">
                        Anda sedang login sebagai: <span className="font-medium text-gray-800">{currentUser?.nama}</span>
                      </p>
                      <p className="text-[14px] font-['Mukta'] text-gray-600">
                        Username: <span className="font-medium text-gray-800">{currentUser?.username}</span>
                      </p>
                    </div>
                    <div className="w-full max-w-md">
                      <p className="text-[13px] font-['Mukta'] text-gray-500 mb-6">
                        Apakah Anda yakin ingin keluar dari akun ini? Anda akan diarahkan kembali ke halaman login.
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setActiveTab('profil')}
                          className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white hover:bg-gray-50 transition-colors font-['Mukta'] text-[14px] text-gray-700"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-['Mukta'] text-[14px] shadow-md hover:shadow-lg"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-[14px] font-['Mukta'] font-medium text-blue-800 mb-1">Informasi</p>
                      <p className="text-[13px] font-['Mukta'] text-blue-700">
                        Logout hanya akan mengeluarkan Anda dari perangkat ini. Untuk logout dari semua perangkat, gunakan fitur "Logout Semua Perangkat" di menu Keamanan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
