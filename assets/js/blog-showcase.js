// Blog listing page: auto-rotating hero (typewriter title + slide cycling)
// and category-tab filtering for the catalog grid below it.
(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function typewrite(el, text, speed) {
    if (prefersReducedMotion()) { el.textContent = text; return; }
    el.textContent = '';
    var i = 0;
    (function step() {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) setTimeout(step, speed);
    })();
  }

  function initFeatureStage() {
    var stage = document.getElementById('blog-feature-stage');
    if (!stage) return;

    var slides = stage.querySelectorAll('.feature-slide');
    var dots = document.querySelectorAll('.feature-dot');
    if (slides.length < 2) return;

    slides.forEach(function (slide) {
      var title = slide.querySelector('.feature-title');
      if (title) title.dataset.full = title.textContent;
    });

    var current = 0;
    var timer = null;

    function show(index) {
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
      var title = slides[index].querySelector('.feature-title');
      if (title) typewrite(title, title.dataset.full || title.textContent, 26);
      current = index;
    }

    function next() { show((current + 1) % slides.length); }

    function startTimer() {
      if (prefersReducedMotion()) return;
      clearInterval(timer);
      timer = setInterval(next, parseInt(stage.dataset.interval, 10) || 5000);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { show(i); startTimer(); });
    });

    show(0);
    startTimer();
  }

  function initCategoryFilter() {
    var tabs = document.querySelectorAll('.blog-cat-btn[data-cat]');
    var grid = document.getElementById('blog-catalog');
    if (!tabs.length || !grid) return;

    var cards = grid.querySelectorAll('.blog-card[data-cat]');
    var empty = document.getElementById('blog-catalog-empty');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var cat = tab.dataset.cat;
        var visibleCount = 0;
        cards.forEach(function (card) {
          var match = cat === 'all' || card.dataset.cat === cat;
          card.hidden = !match;
          if (match) visibleCount++;
        });
        if (empty) empty.hidden = visibleCount > 0;
      });
    });
  }

  // Blog cards are now injected after an async Supabase fetch (see blog-listing.js),
  // so this also runs on demand once that render completes, not just at DOMContentLoaded.
  window.initBlogShowcase = function () { initFeatureStage(); initCategoryFilter(); };

  document.addEventListener('DOMContentLoaded', window.initBlogShowcase);
})();
