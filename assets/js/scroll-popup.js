// Lead popup: fires once per page per browser session.
// - On mobile (narrow viewports), fires on a flat 5-second timer - visitors
//   there tend to scroll fast and skip past a scroll-depth trigger entirely.
// - On desktop, fires the first time the visitor scrolls past 50% of the page.
// - On pages with a #service-popup element, that (service-specific, with a
//   city field) is opened.
// - Otherwise, falls back to clicking an existing [data-lead-modal-trigger]
//   element so the site's general consultation modal opens.
// Never fires twice on the same page load, and skips silently if some other
// modal is already open.
(function () {
  'use strict';

  var MOBILE_DELAY_MS = 5000;

  function isMobile() {
    return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
  }

  function storageKey() {
    var slug = location.pathname.split('/').pop() || 'home';
    return 'sf_scroll_popup_' + slug;
  }

  function alreadyShown() {
    try { return sessionStorage.getItem(storageKey()) === '1'; }
    catch (e) { return false; }
  }

  function markShown() {
    try { sessionStorage.setItem(storageKey(), '1'); } catch (e) {}
  }

  function scrollFraction() {
    var doc = document.documentElement;
    var scrollTop = window.pageYOffset || doc.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    return height > 0 ? scrollTop / height : 0;
  }

  function watchForHalfScroll(onHalf) {
    var ticking = false;
    function check() {
      ticking = false;
      if (scrollFraction() >= 0.5) {
        window.removeEventListener('scroll', onScroll);
        onHalf();
      }
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(check);
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function watchForTrigger(onTrigger) {
    if (isMobile()) { setTimeout(onTrigger, MOBILE_DELAY_MS); return; }
    watchForHalfScroll(onTrigger);
  }

  function anyModalOpen() {
    return !!document.querySelector('.lead-modal-overlay.open');
  }

  function initServicePopup(popup) {
    var closeBtn = popup.querySelector('.lead-modal-close');
    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      popup.hidden = false;
      requestAnimationFrame(function () { popup.classList.add('open'); });
      document.body.style.overflow = 'hidden';
      var firstField = popup.querySelector('input, select, textarea');
      if (firstField) firstField.focus();
    }

    function close() {
      popup.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () { popup.hidden = true; }, 200);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    closeBtn.addEventListener('click', close);
    popup.addEventListener('click', function (e) { if (e.target === popup) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !popup.hidden) close();
    });

    var form = popup.querySelector('form[data-lead-form]');
    var msg = form ? form.querySelector('.form-msg') : null;
    if (form && msg) {
      var observer = new MutationObserver(function () {
        if (msg.classList.contains('success')) {
          setTimeout(function () { if (!popup.hidden) close(); }, 2200);
        }
      });
      observer.observe(msg, { attributes: true, attributeFilter: ['class'] });
    }

    return open;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (alreadyShown()) return;

    var servicePopup = document.getElementById('service-popup');
    if (servicePopup) {
      var openServicePopup = initServicePopup(servicePopup);
      watchForTrigger(function () {
        if (anyModalOpen()) return;
        markShown();
        openServicePopup();
      });
      return;
    }

    var genericTrigger = document.querySelector('[data-lead-modal-trigger]');
    if (genericTrigger) {
      watchForTrigger(function () {
        if (anyModalOpen()) return;
        markShown();
        genericTrigger.click();
      });
    }
  });
})();
