// Conversion tracking + lead attribution.
//
// 1. Captures UTM / click-ID parameters on landing and injects them into every
//    form as hidden fields, so each lead saved to Supabase shows which
//    campaign produced it.
// 2. Fires conversion events to GA4, Meta, Google Ads and LinkedIn - but only
//    those that are loaded, which only happens after marketing/analytics
//    consent (see marketing-pixels.js / analytics.js). Safe to run anywhere.
// 3. Declarative tracking: add data-track="event_name" (optional
//    data-track-label / data-track-value) to any link or button. Phone,
//    email and WhatsApp links are tagged automatically.
//
// Fill in the two placeholders below when your Google Ads / LinkedIn
// conversion actions exist; until then those two are skipped.
(function () {
  'use strict';

  var GOOGLE_ADS_LEAD_SEND_TO = 'AW-XXXXXXXXX/XXXXXXXXXXXX'; // Google Ads > Conversions > Tag setup
  var LINKEDIN_LEAD_CONVERSION_ID = 'XXXXXXX';               // Campaign Manager > Conversions

  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'fbclid', 'msclkid', 'li_fat_id'];
  var STORE = 'stowflex-attribution';

  function isPlaceholder(v) { return v.indexOf('XXXX') !== -1; }

  function loadAttribution() {
    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(STORE) || '{}'); } catch (e) {}
    var params = new URLSearchParams(window.location.search);
    var found = false;
    ATTR_KEYS.forEach(function (k) {
      if (params.get(k)) { saved[k] = params.get(k); found = true; }
    });
    if (!saved.landing_page) saved.landing_page = window.location.pathname;
    if (!saved.referrer && document.referrer) saved.referrer = document.referrer;
    if (found || !sessionStorage.getItem(STORE)) {
      try { sessionStorage.setItem(STORE, JSON.stringify(saved)); } catch (e) {}
    }
    return saved;
  }

  function addHidden(form, name, value) {
    if (!value || form.querySelector('input[name="' + name + '"]')) return;
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  function track(event, params) {
    params = params || {};
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, params));
    if (typeof window.gtag === 'function') window.gtag('event', event, params);
  }

  function trackLead(formName, service) {
    var params = { form_name: formName || 'website_form', service: service || '' };
    track('generate_lead', params);
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: params.form_name });
    if (typeof window.gtag === 'function' && !isPlaceholder(GOOGLE_ADS_LEAD_SEND_TO)) {
      window.gtag('event', 'conversion', { send_to: GOOGLE_ADS_LEAD_SEND_TO });
    }
    if (typeof window.lintrk === 'function' && !isPlaceholder(LINKEDIN_LEAD_CONVERSION_ID)) {
      window.lintrk('track', { conversion_id: Number(LINKEDIN_LEAD_CONVERSION_ID) });
    }
  }

  // Exposed for forms.js and for one-off calls: window.stowflexTrack('event', {...})
  window.stowflexTrack = track;
  window.stowflexTrackLead = trackLead;

  document.addEventListener('DOMContentLoaded', function () {
    var attribution = loadAttribution();

    document.querySelectorAll('form').forEach(function (form) {
      ATTR_KEYS.concat(['landing_page', 'referrer']).forEach(function (k) { addHidden(form, k, attribution[k]); });
      addHidden(form, 'page_url', window.location.href);
    });

    // Lead conversion fires once, on the thank-you page, after a form submit.
    if (/^\/thank-you\/?$/.test(window.location.pathname)) {
      var pending = null;
      try { pending = JSON.parse(sessionStorage.getItem('stowflex-lead') || 'null'); } catch (e) {}
      if (pending) {
        try { sessionStorage.removeItem('stowflex-lead'); } catch (e) {}
        trackLead(pending.form, pending.service);
      }
    }

    document.addEventListener('click', function (e) {
      var el = e.target.closest('a, button');
      if (!el) return;
      var name = el.getAttribute('data-track');
      var label = el.getAttribute('data-track-label') || '';
      var href = el.getAttribute('href') || '';
      if (!name) {
        if (href.indexOf('tel:') === 0) { name = 'phone_click'; label = href.slice(4); }
        else if (href.indexOf('mailto:') === 0) { name = 'email_click'; label = href.slice(7); }
        else if (href.indexOf('wa.me') !== -1) { name = 'whatsapp_click'; }
        else if (el.hasAttribute('data-lead-modal-trigger')) { name = 'open_lead_form'; label = window.location.pathname; }
      }
      if (!name) return;
      var params = { link_label: label, page_path: window.location.pathname };
      var value = el.getAttribute('data-track-value');
      if (value) params.value = Number(value);
      track(name, params);
      if (name === 'phone_click' || name === 'whatsapp_click') {
        if (typeof window.fbq === 'function') window.fbq('track', 'Contact');
      }
    });
  });
})();
