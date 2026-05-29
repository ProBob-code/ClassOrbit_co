'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#faf9f6',
          color: '#1a1c1a',
          border: '1px solid #c1c8c3',
          borderRadius: '1rem',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: '0 8px 32px rgba(93, 123, 111, 0.08)',
        },
        success: {
          iconTheme: {
            primary: '#456257',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ba1a1a',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}
