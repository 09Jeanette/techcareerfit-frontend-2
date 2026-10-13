import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './auth';
import { ToastProvider } from './components/ui';
import './styles/base.css';
import './styles/motion.css';
import './styles/components.css';
import './styles/landing.css';
import './styles/auth.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>,
);
