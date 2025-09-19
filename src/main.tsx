// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';


function applyTheme(theme: 'light' | 'dark' | 'auto') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'light') {
    root.classList.add('light');
  } else if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.classList.toggle('light', !prefersDark);
  }
}


const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | 'auto' | null;


applyTheme(savedTheme || 'light');


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/admin-panel">
      <App />
    </BrowserRouter>
  </StrictMode>
);