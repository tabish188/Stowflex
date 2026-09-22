// Renders the blog listing page (feature hero + category grid) straight from
// Supabase - no build step. A newly published post appears here on refresh;
// a deleted one disappears just as fast.
(function () {
  'use strict';
  var B = window.StowflexBlog;
  if (!B) return;

  function featureSlideHtml(p, i) {
    return '<div class="feature-slide' + (i === 0 ? ' is-active' : '') + '">' +
      '<div class="blog-feature-content">' +
      '<span class="blog-feature-tag feature-tag">Latest &middot; ' + B.esc(p.category) + '</span>' +
      '<h1 class="feature-title">' + B.esc(p.title) + '</h1>' +
      '<p>' + B.esc(p.excerpt) + '</p>' +
      '<div class="blog-feature-meta">' + B.esc(B.formatDate(p.date)) + ' &middot; ' + p.readingTime + ' min read</div>' +
      '<a class="btn btn-secondary" href="blog/' + encodeURIComponent(p.slug) + '">Read Article <svg class="icon icon-sm" aria-hidden="true"><use href="#i-chevron-right"></use></svg></a>' +
      '</div><div class="blog-feature-media">' +
      '<img src="' + B.relImg(p.image) + '" alt="" width="900" height="675" style="object-position:' + p.imagePosition + '"' + (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + '></div></div>';
  }

  function cardHtml(p) {
    return '<a class="blog-card reveal" data-cat="' + B.esc(p.category) + '" href="blog/' + encodeURIComponent(p.slug) + '">' +
      '<img src="' + B.relImg(p.image) + '" alt="" width="1200" height="630" loading="lazy" style="object-position:' + p.imagePosition + '">' +
      '<div class="body"><span class="blog-card-tag">' + B.esc(p.category) + '</span>' +
      '<div class="meta">' + B.esc(B.formatDate(p.date)) + ' &middot; ' + p.readingTime + ' min read</div>' +
      '<h3>' + B.esc(p.title) + '</h3><p>' + B.esc(p.excerpt) + '</p>' +
      '<span class="link-cta">Read more <svg class="icon icon-sm" aria-hidden="true"><use href="#i-chevron-right"></use></svg></span></div></a>';
  }

  function render(posts) {
    posts.forEach(function (p) { p.readingTime = B.readingTime(p.body); });
    var stageWrap = document.getElementById('blog-feature-wrap');
    var catalogWrap = document.getElementById('blog-catalog-wrap');

    if (!posts.length) {
      if (stageWrap) stageWrap.innerHTML = '<section class="hero section-tight"><div class="container">' +
        '<span class="eyebrow">Insights</span><h1>The StowFlex Blog</h1>' +
        '<p class="text-muted" style="margin-top:12px;font-size:var(--fs-body-lg);max-width:40rem">Practical guidance on warehousing, fulfillment and logistics &mdash; from the team running the operation.</p>' +
        '</div></section>';
      if (catalogWrap) catalogWrap.innerHTML = '<section class="section-tight"><div class="container"><p class="blog-empty">New posts are on the way &mdash; check back soon.</p></div></section>';
      return;
    }

    if (stageWrap) {
      stageWrap.innerHTML = '<section class="blog-feature"><div class="container">' +
        '<div class="feature-stage" id="blog-feature-stage" data-interval="5500">' + posts.map(featureSlideHtml).join('') + '</div>' +
        '<div class="feature-dots">' + posts.map(function (p, i) { return '<button class="feature-dot' + (i === 0 ? ' is-active' : '') + '" data-index="' + i + '" aria-label="Show ' + B.esc(p.title) + '"></button>'; }).join('') + '</div>' +
        '</div></section>';
    }

    var categories = [];
    posts.forEach(function (p) { if (categories.indexOf(p.category) === -1) categories.push(p.category); });
    var catTabs = ['All'].concat(categories).map(function (c, i) {
      return '<button class="blog-cat-btn' + (i === 0 ? ' is-active' : '') + '" data-cat="' + (i === 0 ? 'all' : B.esc(c)) + '">' + B.esc(c) + '</button>';
    }).join('');

    if (catalogWrap) {
      catalogWrap.innerHTML = '<section class="section-tight"><div class="container">' +
        '<div class="section-head"><h2>Explore by Category</h2><p>Browse everything we\'ve published, grouped by topic.</p></div>' +
        '<div class="blog-cat-tabs" role="tablist">' + catTabs + '</div>' +
        '<div class="blog-grid" id="blog-catalog">' + posts.map(cardHtml).join('') + '</div>' +
        '<p class="blog-empty" id="blog-catalog-empty" hidden>No posts in this category yet.</p>' +
        '</div></section>';
    }

    if (window.initBlogShowcase) window.initBlogShowcase();
    if (window.initReveal) window.initReveal();
  }

  document.addEventListener('DOMContentLoaded', function () {
    B.fetchPublishedPosts().then(render);
  });
})();
