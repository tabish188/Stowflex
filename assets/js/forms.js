// Client-side validation + real submission handling for lead / inquiry /
// newsletter forms. Every form on the site submits straight to Supabase
// (table: public.leads) - no backend/build step involved. The anon key can
// only INSERT rows here (see supabase/setup.sql), never read them back.
(function () {
  'use strict';

  var pageLoadTime = Date.now();
  var MIN_FILL_SECONDS = 2; // submissions faster than this are almost certainly bots

  var LEAD_COLUMNS = [
    'name', 'company', 'email', 'phone', 'city', 'service', 'message', 'page_url', 'landing_page', 'referrer',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid', 'li_fat_id'
  ];

  function isBot(form) {
    var honeypot = form.querySelector('input[name="bot-field"]');
    if (honeypot && honeypot.value) return true;
    if ((Date.now() - pageLoadTime) / 1000 < MIN_FILL_SECONDS) return true;
    return false;
  }

  function submitForm(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    var cfg = window.STOWFLEX_SUPABASE || {};
    var row = { form_name: data['form-name'] || form.getAttribute('name') || 'website form' };
    LEAD_COLUMNS.forEach(function (k) { row[k] = data[k] || null; });
    return fetch(cfg.url.replace(/\/$/, '') + '/rest/v1/leads', {
      method: 'POST',
      headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row)
    });
  }

  function validateField(field) {
    var input = field.querySelector('input, select, textarea');
    if (!input) return true;
    var valid = input.checkValidity();
    field.classList.toggle('has-error', !valid);
    var errorEl = field.querySelector('.field-error');
    if (errorEl && !valid) {
      if (input.validity.valueMissing) errorEl.textContent = 'This field is required.';
      else if (input.validity.typeMismatch) errorEl.textContent = 'Enter a valid value.';
      else errorEl.textContent = errorEl.dataset.default || 'Please check this field.';
    }
    return valid;
  }

  function initLeadForm(form) {
    var fields = form.querySelectorAll('.field');
    var submitBtn = form.querySelector('button[type="submit"]');
    var msg = form.querySelector('.form-msg');

    fields.forEach(function (field) {
      var input = field.querySelector('input, select, textarea');
      if (!input) return;
      input.addEventListener('blur', function () { validateField(field); });
      input.addEventListener('input', function () {
        if (field.classList.contains('has-error')) validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (isBot(form)) {
        // Silently "succeed" so bots don't learn their submission was dropped.
        window.location.href = form.getAttribute('action') || '/thank-you';
        return;
      }

      var allValid = true;
      fields.forEach(function (field) { if (!validateField(field)) allValid = false; });
      if (!allValid) {
        if (msg) { msg.textContent = 'Please fix the highlighted fields.'; msg.className = 'form-msg error'; }
        var firstError = form.querySelector('.field.has-error input, .field.has-error select, .field.has-error textarea');
        if (firstError) firstError.focus();
        return;
      }

      var originalLabel = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending&hellip;';

      submitForm(form).then(function (res) {
        if (res.ok) {
          try {
            var svc = form.querySelector('[name="service"]');
            sessionStorage.setItem('stowflex-lead', JSON.stringify({ form: form.getAttribute('name'), service: svc ? svc.value : '' }));
          } catch (e) {}
          window.location.href = form.getAttribute('action') || '/thank-you';
          return;
        }
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
        if (msg) { msg.textContent = 'Something went wrong — please call us instead.'; msg.className = 'form-msg error'; }
      }).catch(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
        if (msg) { msg.textContent = 'Something went wrong — please call us instead.'; msg.className = 'form-msg error'; }
      });
    });
  }

  function initNewsletterForm(form) {
    var input = form.querySelector('input[type="email"]');
    var msg = form.querySelector('.form-msg');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (isBot(form)) {
        if (msg) { msg.textContent = 'Thanks — you are subscribed.'; msg.className = 'form-msg success'; }
        form.reset();
        return;
      }
      if (!input.value || !input.validity.valid) {
        if (msg) { msg.textContent = 'Enter a valid email address.'; msg.className = 'form-msg error'; }
        return;
      }

      submitForm(form).then(function (res) {
        if (res.ok) {
          if (msg) { msg.textContent = 'Thanks — you are subscribed.'; msg.className = 'form-msg success'; }
          if (window.stowflexTrack) window.stowflexTrack('newsletter_signup', { form_name: form.getAttribute('name') });
          if (typeof window.fbq === 'function') window.fbq('track', 'Subscribe');
          form.reset();
        } else {
          if (msg) { msg.textContent = 'Something went wrong. Try again later.'; msg.className = 'form-msg error'; }
        }
      }).catch(function () {
        if (msg) { msg.textContent = 'Something went wrong. Try again later.'; msg.className = 'form-msg error'; }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-lead-form]').forEach(initLeadForm);
    document.querySelectorAll('[data-newsletter-form]').forEach(initNewsletterForm);
  });
})();
