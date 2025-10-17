let initialized = false;

export const initAnalytics = () => {
  const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  if (!measurementId || initialized || typeof document === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  initialized = true;
};

export const trackPageView = (path) => {
  const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  if (!measurementId || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('config', measurementId, { page_path: path });
};
