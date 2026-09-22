// Animated stat counters: count up from 0 when scrolled into view.
(function () {
  'use strict';

  function formatIndian(n) {
    var s = String(Math.round(n));
    if (s.length <= 3) return s;
    var lastThree = s.slice(-3);
    var other = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return other + ',' + lastThree;
  }

  function animateCount(el, prefix, target, suffix, duration) {
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = eased * target;
      el.textContent = prefix + formatIndian(current) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + formatIndian(target) + suffix;
    }
    requestAnimationFrame(step);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    var parsed = [];
    document.querySelectorAll('.stat-num').forEach(function (el) {
      var m = el.textContent.match(/^([^\d]*)([\d,]+)(.*)$/);
      if (!m) return;
      var target = parseInt(m[2].replace(/,/g, ''), 10);
      if (isNaN(target)) return;
      parsed.push({ el: el, prefix: m[1], target: target, suffix: m[3] });
    });
    if (!parsed.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var match = parsed.find(function (p) { return p.el === entry.target; });
        if (match) animateCount(match.el, match.prefix, match.target, match.suffix, 1200);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    parsed.forEach(function (p) { observer.observe(p.el); });
  });
})();
