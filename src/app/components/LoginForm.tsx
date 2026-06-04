import { useState, useEffect } from 'react';
import imgGeminiGeneratedImageDc0Jg2Dc0Jg2Dc0J1 from "figma:asset/3c124ebb301c4c59559cc4676c1ac49ddf81b7aa.png";
import imgKelompok2BPptPjd2026Sesi13 from "figma:asset/ffce630baec0cd31633a2dae4066e097077dd679.png";
import { initializeUsers, validateLogin, setCurrentUser } from '../utils/userData';
import { validateLoginOnServer } from '../utils/serverApi';
import { addRiwayat } from '../utils/documentData';

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    initializeUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Harap isi nama pengguna dan kata sandi');
      return;
    }

    let user = null;
    try {
      user = await validateLoginOnServer(username, password);
    } catch (error) {
      console.warn('Server login tidak tersedia, fallback ke local', error);
    }
    // Jika server tidak menemukan user (null) atau server error, coba dari localStorage
    if (!user) {
      user = validateLogin(username, password);
    }

    if (user) {
      setError('');
      
      // Restore photo from localStorage backup if it exists and is a real base64 image
      const isRealFoto = user.foto && user.foto.startsWith('data:image/') && user.foto.length > 100;
      if (!isRealFoto && user.username) {
        const cachedPhoto = localStorage.getItem(`profile-photo-${user.username.toLowerCase()}`);
        if (cachedPhoto && cachedPhoto.startsWith('data:image/') && cachedPhoto.length > 100) {
          user.foto = cachedPhoto;
        }
      }
      
      setCurrentUser(user);
      const loginTime = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';
      addRiwayat({
        waktu: loginTime,
        user: user.nama,
        role: user.role,
        action: 'Login',
        kategori: 'Masuk',
        pesan: `${user.nama} berhasil login ke aplikasi`,
        puskesmas: user.puskesmas || null,
      });
      onLogin();
    } else {
      setError('Nama pengguna atau kata sandi salah');
    }
  };

  return (
    <div
      className="relative w-full h-screen flex overflow-hidden"
      style={{
        background: "linear-gradient(152.011deg, rgba(111, 207, 151, 0.9) 12.923%, rgba(83, 184, 145, 0.9) 25.596%, rgba(54, 160, 139, 0.9) 43.093%, rgba(83, 184, 145, 0.9) 70.605%, rgba(111, 207, 151, 0.9) 90.502%)"
      }}
    >
      {/* Left side */}
      <div className="relative w-[55%] h-full flex items-center justify-center bg-white bg-opacity-95">
        {/* Background image overlay */}
        <div className="absolute inset-0 opacity-10">
          <img alt="" className="w-full h-full object-cover" src={imgGeminiGeneratedImageDc0Jg2Dc0Jg2Dc0J1} />
        </div>
        {/* Logo — perfectly centered */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-4">
          <div className="w-[380px] h-[360px]">
            <img alt="Logo" className="w-full h-full object-contain" src={imgKelompok2BPptPjd2026Sesi13} />
          </div>
          <div className="text-center">
            <p className="text-[#1f6f5f] text-xl font-['Mukta'] font-semibold">ProClaim Check</p>
            <p className="text-[#5e5e5e] text-sm font-['Mukta']">Sistem Verifikasi Berkas Prolanis</p>
          </div>
        </div>
      </div>

      {/* Right side — Login form */}
      <div className="w-[45%] h-full flex items-center justify-center px-12">
        <div className="bg-white rounded-[30px] w-full max-w-[417px] p-8 shadow-2xl">
          <h1 className="text-[25px] font-['Mukta'] font-bold text-black text-center mb-2">
            Masuk ke ProClaim Check
          </h1>
          <p className="text-[15px] font-['Mukta'] font-extralight text-[#5e5e5e] text-center mb-8">
            Masukkan nama pengguna dan password Anda
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[16px] font-['Mukta'] font-medium text-black mb-2">
                Nama Pengguna
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tuliskan nama pengguna"
                className="w-full h-[46px] bg-[#d9ece2] bg-opacity-40 border border-[#695757] rounded-[4px] px-4 text-[15px] font-['Mukta'] text-black placeholder-[#5e5e5e] placeholder-opacity-40 focus:outline-none focus:border-[#1f6f5f] focus:bg-opacity-60 transition-all"
              />
            </div>

            <div>
              <label className="block text-[16px] font-['Mukta'] font-medium text-black mb-2">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full h-[46px] bg-[#d9ece2] bg-opacity-40 border border-[#695757] rounded-[4px] px-4 text-[15px] font-['Mukta'] text-black placeholder-[#5e5e5e] placeholder-opacity-40 focus:outline-none focus:border-[#1f6f5f] focus:bg-opacity-60 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm font-['Mukta'] text-center">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-[12px] h-[12px] border border-black rounded-[2px] opacity-40 cursor-pointer"
                />
                <span className="text-[12px] font-['Mukta'] font-extralight text-[#5e5e5e]">
                  Ingat saya
                </span>
              </label>
              <button type="button" className="text-[12px] font-['Mukta'] font-medium text-[#068a6a] hover:underline">
                Lupa kata sandi?
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-[46px] bg-[#1f6f5f] rounded-[10px] text-[16px] font-['Mukta'] font-bold text-white hover:bg-[#165449] transition-colors shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Masuk
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#5e5e5e] font-['Mukta']">
              Sistem Verifikasi Berkas Prolanis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
