export interface User {
  id: string;
  username: string;
  password: string;
  nama: string;
  email: string;
  role: string;
  foto?: string;
}

// Default users for demo
const defaultUsers: User[] = [
  {
    id: '1',
    username: 'tabita',
    password: 'admin123',
    nama: 'Tabita Antika',
    email: 'tabita.antika@example.com',
    role: 'Administrasi Klaim',
  },
  {
    id: '2',
    username: 'kanaya',
    password: 'puskesmas123',
    nama: 'Kanaya Talita',
    email: 'kanaya.talita@example.com',
    role: 'Petugas Puskesmas',
  },
  {
    id: '3',
    username: 'ferdyana',
    password: 'puskesmas123',
    nama: 'Ferdyana',
    email: 'ferdyana@example.com',
    role: 'Petugas Puskesmas',
  },
];

// Initialize users in localStorage if not exists
export const initializeUsers = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('users');
    if (!stored) {
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
  }
};

// Get all users
export const getUsers = (): User[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('users');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return defaultUsers;
};

// Save all users
export const saveUsers = (users: User[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('users', JSON.stringify(users));
  }
};

// Validate login credentials
export const validateLogin = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  return user || null;
};

// Get current logged in user
export const getCurrentUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
};

// Set current logged in user
export const setCurrentUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};

// Clear current user (logout)
export const clearCurrentUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
};

// Update user profile
export const updateUserProfile = (userId: string, updates: Partial<User>): boolean => {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return false;
  }

  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsers(users);

  // Update current user if it's the same user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(users[userIndex]);
  }

  return true;
};

// Change password
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
