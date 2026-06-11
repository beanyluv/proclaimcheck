import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';

// SSO Session Synchronization for dynamic subdomains
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const syncSession = urlParams.get('session_sync');
  const syncActive = urlParams.get('session_active');
  
  if (syncSession) {
    try {
      const decodedUser = decodeURIComponent(syncSession);
      localStorage.setItem('currentUser', decodedUser);
      
      if (syncActive) {
        localStorage.setItem('session-last-active', syncActive);
      } else {
        localStorage.setItem('session-last-active', Date.now().toString());
      }
      localStorage.setItem('session-login-time', Date.now().toString());
      
      // Clean the query parameters from the address bar
      urlParams.delete('session_sync');
      urlParams.delete('session_active');
      const newSearch = urlParams.toString();
      const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (e) {
      console.error('Failed to sync session from URL', e);
    }
  }
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(React.createElement(App));
}

