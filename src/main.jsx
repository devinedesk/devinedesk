import React from 'react';
import { createRoot } from 'react-dom/client';
import StandaloneShell from '../components/StandaloneShell';
import '../app/globals.css';

const appElement = document.getElementById('app');

if (appElement) {
  const root = createRoot(appElement);
  root.render(
    <React.StrictMode>
      <StandaloneShell />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find #app element');
}
