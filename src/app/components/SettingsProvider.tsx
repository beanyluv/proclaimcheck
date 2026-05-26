import { useEffect, useState, ReactNode } from 'react';
import { getSettings, AppSettings } from '../utils/settingsData';

interface SettingsProviderProps {
  children: ReactNode;
}

export default function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  useEffect(() => {
    // Listen for settings updates
    const handleSettingsUpdate = () => {
      setSettings(getSettings());
    };

    window.addEventListener('settings-updated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply font size class to root
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (settings.fontSize) {
      case 'small':
        document.documentElement.classList.add('text-sm');
        break;
      case 'large':
        document.documentElement.classList.add('text-lg');
        break;
      default:
        document.documentElement.classList.add('text-base');
    }
  }, [settings]);

  return <>{children}</>;
}
