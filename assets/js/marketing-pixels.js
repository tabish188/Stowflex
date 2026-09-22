// Marketing / retargeting pixels — Meta Pixel, Google Ads remarketing tag,
// and LinkedIn Insight Tag. Each loads only after marketing consent is
// granted, and only once you've replaced its placeholder ID below with a
// real one. Until then this file is a no-op, so the site works fine without
// it — safe to ship ahead of any ad campaign actually going live.
(function () {
  'use strict';
  var META_PIXEL_ID = 'XXXXXXXXXXXXXXX';   // <-- Meta Events Manager > Pixel ID
  var GOOGLE_ADS_ID = 'AW-XXXXXXXXX';       // <-- Google Ads > Conversion ID
  var LINKEDIN_PARTNER_ID = 'XXXXXXX';      // <-- LinkedIn Campaign Manager > Insight Tag partner ID
  var STORAGE_KEY = 'stowflex-cookie-consent';

  function isPlaceholder(id) {
    return id.indexOf('XXXX') !== -1;
  }

  function loadMetaPixel() {
    if (isPlaceholder(META_PIXEL_ID) || window.__stowflexMetaLoaded) return;
    window.__stowflexMetaLoaded = true;
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function loadGoogleAds() {
    if (isPlaceholder(GOOGLE_ADS_ID) || window.__stowflexGAdsLoaded) return;
    window.__stowflexGAdsLoaded = true;
    if (!window.__stowflexGtagScriptLoaded) {
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_ADS_ID;
      document.head.appendChild(script);
      window.__stowflexGtagScriptLoaded = true;
    }
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_ADS_ID);
  }

  function loadLinkedInInsight() {
    if (isPlaceholder(LINKEDIN_PARTNER_ID) || window.__stowflexLinkedInLoaded) return;
    window.__stowflexLinkedInLoaded = true;
    window._linkedin_partner_id = LINKEDIN_PARTNER_ID;
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(LINKEDIN_PARTNER_ID);
    (function (l) {
      if (!l) {
        window.lintrk = function (a, b) { window.lintrk.q.push([a, b]); };
        window.lintrk.q = [];
      }
      var s = document.getElementsByTagName('script')[0];
      var b = document.createElement('script');
      b.type = 'text/javascript'; b.async = true;
      b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
      s.parentNode.insertBefore(b, s);
    })(window.lintrk);
  }

  function loadAll() {
    loadMetaPixel();
    loadGoogleAds();
    loadLinkedInInsight();
  }

  function hasStoredMarketingConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'granted') return true;
      if (!raw || raw === 'denied') return false;
      return !!JSON.parse(raw).marketing;
    } catch (e) { return false; }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (hasStoredMarketingConsent()) loadAll();
  });
  document.addEventListener('stowflex-consent-updated', function (e) {
    if (e.detail && e.detail.marketing) loadAll();
  });
})();
