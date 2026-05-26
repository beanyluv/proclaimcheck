import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import imgGeminiGeneratedImageDc0Jg2Dc0Jg2Dc0J1 from "figma:asset/3c124ebb301c4c59559cc4676c1ac49ddf81b7aa.png";
import imgKelompok2BPptPjd2026Sesi13 from "figma:asset/ffce630baec0cd31633a2dae4066e097077dd679.png";
import LoginForm from '../components/LoginForm';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show splash for 3 seconds
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Wait for fade out animation before showing login form
      setTimeout(() => {
        setShowSplash(false);
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    onLogin();
    navigate('/beranda');
  };

  const handleSplashClick = () => {
    setFadeOut(true);
    setTimeout(() => {
      setShowSplash(false);
    }, 500);
  };

  if (showSplash) {
    return (
      <div
        className={`w-full h-screen flex items-center justify-center overflow-hidden transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
        style={{
          background: "linear-gradient(152.011deg, rgba(111, 207, 151, 0.9) 12.923%, rgba(83, 184, 145, 0.9) 25.596%, rgba(54, 160, 139, 0.9) 43.093%, rgba(83, 184, 145, 0.9) 70.605%, rgba(111, 207, 151, 0.9) 90.502%)"
        }}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-white opacity-95"></div>

        {/* Background image */}
        <div className="absolute inset-0 opacity-10">
          <img
            alt=""
            className="w-full h-full object-cover"
            src={imgGeminiGeneratedImageDc0Jg2Dc0Jg2Dc0J1}
          />
        </div>

        {/* Splash screen content */}
        <div
          className="relative z-10 flex flex-col items-center justify-center gap-8 cursor-pointer hover:scale-105 transition-transform animate-pulse"
          onClick={handleSplashClick}
        >
          <div className="w-[486px] h-[457px]">
            <img
              alt="Logo"
              className="w-full h-full object-contain"
              src={imgKelompok2BPptPjd2026Sesi13}
            />
          </div>
          <div className="text-center">
            <p className="text-[#1f6f5f] text-2xl font-['Mukta'] font-semibold">ProClaim Check</p>
            <p className="text-[#5e5e5e] text-sm font-['Mukta'] mt-2">Sistem Verifikasi Berkas Prolanis</p>
            <p className="text-[#1f6f5f] text-xs font-['Mukta'] mt-4 animate-bounce">Klik atau tunggu untuk melanjutkan...</p>
          </div>
        </div>
      </div>
    );
  }

  return <LoginForm onLogin={handleLogin} />;
}
