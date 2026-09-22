// FAQ page: accordion (one open per section) + category tab switching.
(function () {
  'use strict';

  function setPanelHeight(item, open) {
    var panel = item.querySelector('.accordion-panel');
    var trigger = item.querySelector('.accordion-trigger');
    if (open) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    } else {
      panel.style.maxHeight = '0px';
    }
    item.dataset.open = open ? 'true' : 'false';
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function initAccordions() {
    document.querySelectorAll('.faq-section').forEach(function (section) {
      var items = section.querySelectorAll('.accordion-item');
      items.forEach(function (item) {
        setPanelHeight(item, item.dataset.open === 'true');
        var trigger = item.querySelector('.accordion-trigger');
        trigger.addEventListener('click', function () {
          var willOpen = item.dataset.open !== 'true';
          items.forEach(function (other) { setPanelHeight(other, false); });
          setPanelHeight(item, willOpen);
        });
      });
    });
  }

  function initCategoryTabs() {
    var tabs = document.querySelectorAll('.faq-cat-btn[data-cat]');
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.setAttribute('aria-selected', 'false'); });
        tab.setAttribute('aria-selected', 'true');
        document.querySelectorAll('.faq-section').forEach(function (section) {
          section.hidden = section.id !== 'faq-' + tab.dataset.cat;
        });
        // Recalculate the open accordion's height in the newly-shown section
        // (it was 0-height while hidden, so scrollHeight was wrong).
        var shown = document.getElementById('faq-' + tab.dataset.cat);
        var openItem = shown.querySelector('.accordion-item[data-open="true"]');
        if (openItem) setPanelHeight(openItem, true);
      });
    });
  }

  // Blog articles inject their FAQ markup after an async Supabase fetch, so
  // blog-post.js calls this again once that content lands in the DOM.
  window.initFaqAccordions = initAccordions;

  document.addEventListener('DOMContentLoaded', function () {
    initAccordions();
    initCategoryTabs();
  });
})();
