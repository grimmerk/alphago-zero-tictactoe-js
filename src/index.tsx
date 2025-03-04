// Import polyfills first
import './polyfills';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Create a root
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = ReactDOM.createRoot(rootElement);

// Render the App
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
