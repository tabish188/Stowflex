// Instant consultation modal. Any element with [data-lead-modal-trigger]
// opens it instead of navigating. Falls back to normal navigation if JS
// fails, since trigger links keep a real href.
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var modal = document.getElementById('lead-modal');
    if (!modal) return;

    var closeBtn = modal.querySelector('.lead-modal-close');
    var form = modal.querySelector('form[data-lead-form]');
    var msg = form ? form.querySelector('.form-msg') : null;
    var lastFocused = null;
    var open = false;

    function openModal() {
      lastFocused = document.activeElement;
      modal.hidden = false;
      requestAnimationFrame(function () { modal.classList.add('open'); });
      document.body.style.overflow = 'hidden';
      open = true;

      var firstField = modal.querySelector('input, select, textarea');
      if (firstField) firstField.focus();
    }

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      open = false;
      setTimeout(function () { modal.hidden = true; }, 200);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    document.querySelectorAll('[data-lead-modal-trigger]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    });

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) closeModal();
      if (e.key === 'Tab' && open) {
        var focusable = modal.querySelectorAll('input, select, textarea, button');
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Auto-close a couple seconds after a successful submission.
    if (form && msg) {
      var observer = new MutationObserver(function () {
        if (msg.classList.contains('success')) {
          setTimeout(function () { if (open) closeModal(); }, 2200);
        }
      });
      observer.observe(msg, { attributes: true, attributeFilter: ['class'] });
    }
  });
})();
