import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { applyThemeMode } from './theme';

applyThemeMode(localStorage.getItem('color-theme') === 'dark' ? 'dark' : 'light');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
