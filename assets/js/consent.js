// Cookie consent banner with granular categories (analytics, marketing).
// Stores the choice in localStorage and broadcasts 'stowflex-consent-updated'
// with { analytics, marketing } — analytics.js and marketing-pixels.js listen
// for this (and also check localStorage on load), so nothing non-essential
// runs before a real choice has been recorded.
(function () {
  'use strict';
  var STORAGE_KEY = 'stowflex-cookie-consent';

  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      if (raw === 'granted') return { analytics: true, marketing: true };
      if (raw === 'denied') return { analytics: false, marketing: false };
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (e) {}
  }
  function broadcast(value) {
    if (typeof window.gtag === 'function') {
      var a = value.analytics ? 'granted' : 'denied';
      var m = value.marketing ? 'granted' : 'denied';
      window.gtag('consent', 'update', {
        analytics_storage: a, ad_storage: m, ad_user_data: m, ad_personalization: m
      });
    }
    document.dispatchEvent(new CustomEvent('stowflex-consent-updated', { detail: value }));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;

    var existing = getConsent();
    if (existing) {
      broadcast(existing);
      return;
    }

    banner.classList.add('show');
    document.body.classList.add('cookie-banner-open');

    var accept = document.getElementById('cookie-accept');
    var decline = document.getElementById('cookie-decline');
    var customize = document.getElementById('cookie-customize');
    var prefs = document.getElementById('cookie-prefs');
    var prefAnalytics = document.getElementById('cookie-pref-analytics');
    var prefMarketing = document.getElementById('cookie-pref-marketing');
    var savePrefs = document.getElementById('cookie-save-prefs');

    function dismiss() {
      banner.classList.remove('show');
      document.body.classList.remove('cookie-banner-open');
    }
    function apply(value) {
      setConsent(value);
      dismiss();
      broadcast(value);
    }

    if (customize) customize.addEventListener('click', function () {
      if (prefs) prefs.hidden = !prefs.hidden;
    });
    if (accept) accept.addEventListener('click', function () {
      apply({ analytics: true, marketing: true });
    });
    if (decline) decline.addEventListener('click', function () {
      apply({ analytics: false, marketing: false });
    });
    if (savePrefs) savePrefs.addEventListener('click', function () {
      apply({
        analytics: !!(prefAnalytics && prefAnalytics.checked),
        marketing: !!(prefMarketing && prefMarketing.checked)
      });
    });
  });
})();
