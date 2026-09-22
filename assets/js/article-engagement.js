// Blog post page: copy-link button and a personal (per-browser) like toggle.
// The like button is intentionally not a public counter — this is a static
// site with no backend to tally real likes, so it only remembers this
// visitor's own choice rather than faking a shared count.
(function () {
  'use strict';

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function initCopyLink() {
    var btns = document.querySelectorAll('[data-copy-link]');
    btns.forEach(function (btn) {
      var label = btn.querySelector('.copy-label');
      var original = label ? label.textContent : '';
      btn.addEventListener('click', function () {
        var url = window.location.href;
        var showCopied = function () {
          if (!label) return;
          label.textContent = 'Copied!';
          setTimeout(function () { label.textContent = original; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(showCopied).catch(function () {
            fallbackCopy(url);
            showCopied();
          });
        } else {
          fallbackCopy(url);
          showCopied();
        }
      });
    });
  }

  function initLike() {
    var btn = document.querySelector('[data-like-btn]');
    if (!btn) return;
    var key = 'stowflex-liked:' + window.location.pathname;
    var liked = false;
    try { liked = localStorage.getItem(key) === '1'; } catch (e) {}
    if (liked) btn.classList.add('is-liked');
    btn.addEventListener('click', function () {
      liked = !liked;
      btn.classList.toggle('is-liked', liked);
      try { localStorage.setItem(key, liked ? '1' : '0'); } catch (e) {}
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCopyLink();
    initLike();
  });
})();
