// Case studies page: wide testimonial carousel with prev/next buttons + dots.
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var track = document.getElementById('testi-carousel-track');
    var prev = document.getElementById('testi-carousel-prev');
    var next = document.getElementById('testi-carousel-next');
    var dotsWrap = document.getElementById('testi-carousel-dots');
    if (!track || !prev || !next) return;

    var cards = track.querySelectorAll('.testi-card');
    if (!cards.length) return;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (dotsWrap) {
      cards.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'testi-carousel-dot';
        dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
        dot.addEventListener('click', function () { scrollToIndex(i); });
        dotsWrap.appendChild(dot);
      });
    }
    var dots = dotsWrap ? dotsWrap.querySelectorAll('.testi-carousel-dot') : [];

    function cardStep() {
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 24;
      return cards[0].getBoundingClientRect().width + gap;
    }

    function currentIndex() {
      return Math.round(track.scrollLeft / cardStep());
    }

    function updateUI() {
      var idx = currentIndex();
      var maxScroll = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= maxScroll - 4;
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
    }

    function scrollToIndex(i) {
      var clamped = Math.max(0, Math.min(cards.length - 1, i));
      track.scrollTo({ left: clamped * cardStep(), behavior: reducedMotion ? 'auto' : 'smooth' });
    }

    prev.addEventListener('click', function () { scrollToIndex(currentIndex() - 1); });
    next.addEventListener('click', function () { scrollToIndex(currentIndex() + 1); });
    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(updateUI);
    }, { passive: true });
    window.addEventListener('resize', updateUI);

    updateUI();
  });
})();
