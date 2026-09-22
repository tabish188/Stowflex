// Google Analytics 4 — loads only after analytics consent is granted, and
// only once you've replaced the placeholder Measurement ID below with your
// real one (from analytics.google.com > Admin > Data Streams). Until then
// this script is a no-op, so the site works fine without it.
(function () {
  'use strict';
  var GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // <-- replace with your real GA4 ID
  var STORAGE_KEY = 'stowflex-cookie-consent';

  function isPlaceholder() {
    return GA_MEASUREMENT_ID.indexOf('XXXX') !== -1;
  }

  function loadGA() {
    if (isPlaceholder() || window.__stowflexGaLoaded) return;
    window.__stowflexGaLoaded = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  function hasStoredAnalyticsConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'granted') return true;
      if (!raw || raw === 'denied') return false;
      return !!JSON.parse(raw).analytics;
    } catch (e) { return false; }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (hasStoredAnalyticsConsent()) loadGA();
  });
  document.addEventListener('stowflex-consent-updated', function (e) {
    if (e.detail && e.detail.analytics) loadGA();
  });
})();
