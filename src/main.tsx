import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

import { checkBrowser } from './lib/browserCheck';
import { UnsupportedBrowserBlock } from './components/shared/UnsupportedBrowserBlock';

const rootElement = document.getElementById('root')!;

if (!checkBrowser()) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <UnsupportedBrowserBlock />
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
