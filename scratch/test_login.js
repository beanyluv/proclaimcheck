// Simulation script to test login photo restore
import { LocalStorage } from 'node-localstorage';

// Mock window and localStorage for Node environment
global.window = {};
global.localStorage = new LocalStorage('./scratch/localstorage_test');

const user = {
  id: '1',
  username: 'tabita',
  nama: 'Tabita Antika',
  email: 'tabita.antika@example.com',
  role: 'Administrasi Klaim',
  foto: null
};

// 1. Simulate saving photo in settings
const updates = {
  nama: 'Tabita Antika New',
  username: 'tabita',
  foto: 'data:image/jpeg;base64,mockphoto123'
};

const updatedUser = { ...user, ...updates };

// Save to localStorage
localStorage.setItem('currentUser', JSON.stringify(updatedUser));
if (updates.foto) {
  localStorage.setItem(`profile-photo-${updatedUser.username}`, updates.foto);
}

console.log('Saved to profile-photo-tabita:', localStorage.getItem('profile-photo-tabita'));

// 2. Simulate Logout
localStorage.removeItem('currentUser');
console.log('Logged out. currentUser in localStorage:', localStorage.getItem('currentUser'));

// 3. Simulate Login with photo restore
const loggedInUser = { ...user }; // returned from server database without photo
console.log('Logged in user from server:', loggedInUser);

const cachedPhoto = localStorage.getItem(`profile-photo-${loggedInUser.username}`);
if (cachedPhoto) {
  loggedInUser.foto = cachedPhoto;
}
localStorage.setItem('currentUser', JSON.stringify(loggedInUser));

console.log('\n--- AFTER RESTORE & LOGIN ---');
const currentUserAfterLogin = JSON.parse(localStorage.getItem('currentUser'));
console.log('currentUser in localStorage:', currentUserAfterLogin);
console.log('Photo exists in currentUser:', !!currentUserAfterLogin.foto);

// Clean up
fs.rmSync('./scratch/localstorage_test', { recursive: true, force: true });
import fs from 'fs';
