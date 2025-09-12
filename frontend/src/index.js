import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './global.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Suppress noisy extension-originated Promise errors in production only.
// This does NOT mask real app errors; it filters a known Chrome extension message
// "A listener indicated an asynchronous response by returning true, but the message channel closed..."
if (process && process.env && process.env.NODE_ENV === 'production') {
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event && event.reason;
      const msg = (reason && (reason.message || String(reason))) || '';
      if (msg.includes('A listener indicated an asynchronous response')) {
        event.preventDefault();
      }
    } catch (_) { /* ignore */ }
  });
}
