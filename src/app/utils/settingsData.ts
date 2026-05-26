export interface AppSettings {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  fontSize: 'small' | 'medium' | 'large';
  bahasa: 'id' | 'en';
  zonaWaktu: string;
}

const defaultSettings: AppSettings = {
  darkMode: false,
  sidebarCollapsed: false,
  fontSize: 'medium',
  bahasa: 'id',
  zonaWaktu: 'Asia/Jakarta',
};

// Get settings from localStorage
export const getSettings = (): AppSettings => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('appSettings');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return defaultSettings;
};

// Save settings to localStorage
export const saveSettings = (settings: AppSettings) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    // Dispatch event to notify all components
    window.dispatchEvent(new Event('settings-updated'));
  }
};

// Update specific setting
export const updateSetting = <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): AppSettings => {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, [key]: value };
  saveSettings(newSettings);
  return newSettings;
};

// Get font size class
export const getFontSizeClass = (fontSize: AppSettings['fontSize']): string => {
  switch (fontSize) {
    case 'small':
      return 'text-sm';
    case 'large':
      return 'text-lg';
    default:
      return 'text-base';
  }
};

// Get current time with timezone
export const getCurrentTime = (zonaWaktu: string): string => {
  try {
    const date = new Date();
    return date.toLocaleString('id-ID', { timeZone: zonaWaktu });
  } catch (error) {
    return new Date().toLocaleString('id-ID');
  }
};
