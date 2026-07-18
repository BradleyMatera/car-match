// Lightweight global toast notifications — no React state required.
// Usage: import { toast } from '../utils/toast'; toast.success('Saved!'); toast.error('Failed.');
// Renders a fixed-position container with auto-dismissing messages.

let container = null;
let counter = 0;

const ensureContainer = () => {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.id = 'toast-container';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  container.style.cssText = 'position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:380px;';
  document.body.appendChild(container);
  return container;
};

const COLORS = {
  success: '#16a34a',
  error: '#dc2626',
  info: '#2563eb',
};

const colorForType = (type) => {
  if (type === 'success') return COLORS.success;
  if (type === 'error') return COLORS.error;
  return COLORS.info;
};

const show = (message, type = 'info', duration = 4000) => {
  const el = ensureContainer();
  const id = ++counter;
  const toast = document.createElement('div');
  toast.dataset.toastId = id;
  toast.style.cssText = `
    pointer-events:auto;
    background:${colorForType(type)};
    color:#fff;
    padding:12px 16px;
    border-radius:8px;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);
    font-size:14px;
    font-family:inherit;
    display:flex;
    align-items:center;
    gap:8px;
    opacity:0;
    transform:translateX(100%);
    transition:opacity 0.25s ease,transform 0.25s ease;
    cursor:pointer;
  `;
  toast.textContent = message;
  toast.title = 'Click to dismiss';
  toast.onclick = () => dismiss(toast);
  el.appendChild(toast);
  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });
  // Auto-dismiss
  setTimeout(() => dismiss(toast), duration);
};

const dismiss = (toast) => {
  if (!toast || !toast.parentNode) return;
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  setTimeout(() => { toast.remove(); }, 250);
};

export const toast = {
  success: (msg, dur) => show(msg, 'success', dur),
  error: (msg, dur) => show(msg, 'error', dur),
  info: (msg, dur) => show(msg, 'info', dur),
};
