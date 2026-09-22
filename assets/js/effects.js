// Opt-in decorative effects: hero parallax + industry-card cursor spotlight.
// Both are gated behind prefers-reduced-motion and only do work while the
// relevant element is actually on screen / actually hovered.
(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initHeroParallax() {
    var media = document.querySelector('.hero-media > img, .hero-media.is-graphic');
    if (!media || prefersReducedMotion()) return;

    var ticking = false;

    function update() {
      var rect = media.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var progress = (vh - rect.top) / (vh + rect.height);
      var offset = (Math.min(Math.max(progress, 0), 1) - 0.5) * 24;
      media.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          media.style.willChange = 'transform';
          window.addEventListener('scroll', onScroll, { passive: true });
          update();
        } else {
          window.removeEventListener('scroll', onScroll);
          media.style.willChange = '';
        }
      });
    }, { threshold: 0 });
    io.observe(media);
  }

  function initIndustrySpotlight() {
    var cards = document.querySelectorAll('.industry-card');
    if (!cards.length || prefersReducedMotion()) return;
    if (!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches)) return;

    var ticking = false;
    var pending = null;

    function apply() {
      if (pending) {
        pending.el.style.setProperty('--mx', pending.x + 'px');
        pending.el.style.setProperty('--my', pending.y + 'px');
      }
      ticking = false;
    }

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        pending = { el: card, x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (!ticking) {
          requestAnimationFrame(apply);
          ticking = true;
        }
      }, { passive: true });
    });
  }

  function initTestiCarousel() {
    var grid = document.getElementById('testi-grid');
    var btn = document.getElementById('testi-next');
    if (!grid || !btn) return;

    btn.addEventListener('click', function () {
      var cards = grid.querySelectorAll('.testi-card');
      if (!cards.length) return;
      var behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      var maxScroll = grid.scrollWidth - grid.clientWidth;
      if (grid.scrollLeft >= maxScroll - 4) {
        grid.scrollTo({ left: 0, behavior: behavior });
        return;
      }
      var gap = parseFloat(getComputedStyle(grid).columnGap || getComputedStyle(grid).gap) || 24;
      var step = cards[0].getBoundingClientRect().width + gap;
      grid.scrollBy({ left: step, behavior: behavior });
    });
  }

  function initWordRotate() {
    var rotators = document.querySelectorAll('.word-rotate');
    if (!rotators.length) return;

    rotators.forEach(function (rotator) {
      var items = rotator.querySelectorAll('.word-rotate-item');
      if (items.length < 2) return;
      if (prefersReducedMotion()) return;

      var current = 0;
      setInterval(function () {
        var next = (current + 1) % items.length;
        items[current].classList.remove('is-active');
        items[current].classList.add('is-leaving');
        items[next].classList.add('is-active');
        setTimeout(function () { items[current].classList.remove('is-leaving'); }, 400);
        current = next;
      }, 2400);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeroParallax();
    initIndustrySpotlight();
    initTestiCarousel();
    initWordRotate();
  });
})();
