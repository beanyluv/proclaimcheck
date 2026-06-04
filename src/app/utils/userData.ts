import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  password: string;
  nama: string;
  email: string;
  role: string;
  foto?: string;
  puskesmas?: string;
}

// user default buat demo
const defaultUsers: User[] = [
  {
    id: '1',
    username: 'tabita',
    password: 'admin123',
    nama: 'Tabita Antika',
    email: 'tabita.antika@example.com',
    role: 'Administrasi Klaim',
  },
];

let cachedUsers: User[] = [...defaultUsers];

// init user
export const initializeUsers = () => {
  // in-memory only, ga pake localstorage lagi buat list
};

// ambil semua user
export const getUsers = (): User[] => {
  return cachedUsers;
};

// simpan user
export const saveUsers = (users: User[]) => {
  cachedUsers = users;
};

// validasi login
export const validateLogin = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (user) {
    const isMatch = user.password === password || (user.password.startsWith('$2') && bcrypt.compareSync(password, user.password));
    if (isMatch) {
      return user;
    }
  }
  return null;
};

// update waktu aktivitas session
export const updateSessionActivity = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('session-last-active', Date.now().toString());
  }
};

// get user login aktif + cek expired session
export const getCurrentUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      // session expired limit: 2 jam
      const lastActive = localStorage.getItem('session-last-active');
      const now = Date.now();
      const EXPIRE_LIMIT = 7200000; 

      if (lastActive && now - parseInt(lastActive, 10) > EXPIRE_LIMIT) {
        clearCurrentUser();
        // trigger logout di app
        window.dispatchEvent(new CustomEvent('user-logout', { detail: { reason: 'session_expired' } }));
        return null;
      }

      const user = JSON.parse(stored);
      const isRealFoto = user.foto && user.foto.startsWith('data:image/') && user.foto.length > 100;
      if (!isRealFoto && user.username) {
        const cachedPhoto = localStorage.getItem(`profile-photo-${user.username.toLowerCase()}`);
        if (cachedPhoto && cachedPhoto.startsWith('data:image/') && cachedPhoto.length > 100) {
          user.foto = cachedPhoto;
        }
      }
      return user;
    }
  }
  return null;
};

// set user login aktif
export const setCurrentUser = (user: User) => {
  if (typeof window !== 'undefined') {
    const isRealFoto = user.foto && user.foto.startsWith('data:image/') && user.foto.length > 100;
    if (!isRealFoto && user.username) {
      const cachedPhoto = localStorage.getItem(`profile-photo-${user.username.toLowerCase()}`);
      if (cachedPhoto && cachedPhoto.startsWith('data:image/') && cachedPhoto.length > 100) {
        user.foto = cachedPhoto;
      }
    }
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('session-login-time', Date.now().toString());
    localStorage.setItem('session-last-active', Date.now().toString());
    
    if (isRealFoto && user.username) {
      localStorage.setItem(`profile-photo-${user.username.toLowerCase()}`, user.foto!);
    }
  }
};

// hapus session (logout)
export const clearCurrentUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('session-login-time');
    localStorage.removeItem('session-last-active');
  }
};

// update profil
export const updateUserProfile = (userId: string, updates: Partial<User>): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return false;
  }

  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsers(users);

  // sync session kalo user yg sama
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(users[userIndex]);
  }

  return true;
};

// ganti pass
export const changePassword = (userId: string, oldPassword: string, newPassword: string): { success: boolean; message: string } => {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, message: 'User tidak ditemukan' };
  }

  if (user.password !== oldPassword) {
    return { success: false, message: 'Password lama salah' };
  }

  user.password = newPassword;
  saveUsers(users);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(user);
  }

  return { success: true, message: 'Password berhasil diubah' };
};
