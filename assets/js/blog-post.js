// Renders a single blog article straight from Supabase - the URL /blog/<slug>
// is rewritten to this page (see _redirects) with the slug still in the path,
// so this reads it back out of location.pathname.
(function () {
  'use strict';
  var B = window.StowflexBlog;
  if (!B) return;

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('slug')) return params.get('slug');
    var parts = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    var last = parts[parts.length - 1] || '';
    if (!last || /^post(\.html)?$/i.test(last)) return '';
    return decodeURIComponent(last.replace(/\.html$/, ''));
  }

  function setMeta(post, url) {
    var title = B.esc(post.metaTitle || (post.title + ' | StowFlex Blog'));
    document.getElementById('doc-title').textContent = post.metaTitle || (post.title + ' | StowFlex Blog');
    document.getElementById('meta-desc').setAttribute('content', post.metaDescription || post.excerpt);
    document.getElementById('meta-canonical').setAttribute('href', post.canonicalUrl || url);
    document.getElementById('meta-robots').setAttribute('content', post.noindex ? 'noindex, follow' : 'index, follow');
    document.getElementById('og-title').setAttribute('content', post.metaTitle || post.title);
    document.getElementById('og-desc').setAttribute('content', post.metaDescription || post.excerpt);
    document.getElementById('og-image').setAttribute('content', /^https?:/.test(post.ogImage || post.image) ? (post.ogImage || post.image) : (B.SITE_URL + B.relImg(post.ogImage || post.image)));
    document.getElementById('og-url').setAttribute('content', post.canonicalUrl || url);
    void title;
    document.getElementById('ld-json').textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt,
      image: /^https?:/.test(post.ogImage || post.image) ? (post.ogImage || post.image) : (B.SITE_URL + B.relImg(post.ogImage || post.image)),
      datePublished: post.date, author: { '@type': 'Organization', name: post.author || B.SITE_NAME },
      publisher: { '@type': 'Organization', name: B.SITE_NAME, logo: { '@type': 'ImageObject', url: B.SITE_URL + '/assets/img/logo.png' } },
      mainEntityOfPage: url
    });
  }

  function sidebarPostHtml(p) {
    return '<a class="sidebar-post" href="' + encodeURIComponent(p.slug) + '">' +
      '<img src="' + B.relImg(p.image) + '" alt="" width="120" height="90" loading="lazy" style="object-position:' + p.imagePosition + '">' +
      '<span><span class="sidebar-post-title">' + B.esc(p.title) + '</span><span class="sidebar-post-date">' + B.esc(B.formatDate(p.date)) + '</span></span></a>';
  }

  function cardHtml(p) {
    return '<a class="blog-card" href="' + encodeURIComponent(p.slug) + '">' +
      '<img src="' + B.relImg(p.image) + '" alt="" width="1200" height="630" loading="lazy" style="object-position:' + p.imagePosition + '">' +
      '<div class="body"><span class="blog-card-tag">' + B.esc(p.category) + '</span>' +
      '<div class="meta">' + B.esc(B.formatDate(p.date)) + ' &middot; ' + B.readingTime(p.body) + ' min read</div>' +
      '<h3>' + B.esc(p.title) + '</h3><p>' + B.esc(p.excerpt) + '</p>' +
      '<span class="link-cta">Read more <svg class="icon icon-sm" aria-hidden="true"><use href="#i-chevron-right"></use></svg></span></div></a>';
  }

  function renderSidebar(post, others) {
    var html = '';
    if (others.length) {
      html += '<div class="sidebar-card is-posts"><span class="sidebar-eyebrow">Category &middot; ' + B.esc(post.category) + '</span><h4>Our Latest Blogs</h4>' +
        '<div class="sidebar-post-list">' + others.slice(0, 4).map(sidebarPostHtml).join('') + '</div></div>';
    }
    if (post.relatedServiceUrl) {
      html += '<a class="sidebar-card is-link" href="../' + B.svcPath(post.relatedServiceUrl) + '">' +
        '<span class="sidebar-eyebrow">Related Service</span><span class="sidebar-link-title">' + B.esc(post.relatedServiceName) + '</span>' +
        '<svg class="icon icon-sm" aria-hidden="true"><use href="#i-chevron-right"></use></svg></a>';
    }
    html += '<div class="sidebar-card is-cta"><div class="sidebar-cta-icon"><svg class="icon" aria-hidden="true"><use href="#i-headset"></use></svg></div>' +
      '<h4>Have a Similar Challenge?</h4><p>Talk to our logistics team about ' + B.esc((post.tags && post.tags[0]) || 'your operation') + ' &mdash; no sales script, just a straight answer.</p>' +
      '<a class="btn btn-primary btn-block" data-lead-modal-trigger href="../faq#contact-form">Get a Free Quote <svg class="icon icon-sm" aria-hidden="true"><use href="#i-chevron-right"></use></svg></a>' +
      '<div class="sidebar-contact"><a href="tel:+918088887750"><svg class="icon icon-sm" aria-hidden="true"><use href="#i-phone"></use></svg> +91 80888 87750</a>' +
      '<a href="https://wa.me/918088887750" target="_blank" rel="noopener"><svg class="icon icon-sm" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.09-1.34C8.53 21.5 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg> WhatsApp Us</a></div>' +
      '<p class="sidebar-trust-note"><svg class="icon icon-sm" aria-hidden="true"><use href="#i-check-circle"></use></svg> No spam. We respond within 1 business day.</p></div>';
    document.getElementById('pt-sidebar').innerHTML = html;
  }

  function render(post, others) {
    var url = B.SITE_URL + '/blog/' + post.slug;
    setMeta(post, url);

    document.getElementById('pt-title').textContent = post.title;
    document.getElementById('pt-date').textContent = B.formatDate(post.date);
    document.getElementById('pt-readtime').textContent = B.readingTime(post.body) + ' min read';
    document.getElementById('pt-author').textContent = 'By ' + (post.author || B.SITE_NAME);
    document.getElementById('pt-tags').innerHTML = (post.tags || []).map(function (t) { return '<span class="tag">' + B.esc(t) + '</span>'; }).join('');
    var cover = document.getElementById('pt-cover');
    cover.src = B.relImg(post.image); cover.style.objectPosition = post.imagePosition;
    document.getElementById('pt-content').innerHTML = B.markdownToHtml(post.body);

    document.getElementById('share-wa').href = 'https://wa.me/?text=' + encodeURIComponent(post.title + ' ' + url);
    document.getElementById('share-li').href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
    document.getElementById('share-x').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(post.title) + '&url=' + encodeURIComponent(url);
    document.getElementById('share-fb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
    document.getElementById('share-mail').href = 'mailto:?subject=' + encodeURIComponent(post.title) + '&body=' + encodeURIComponent(url);

    var others4 = others.filter(function (p) { return p.slug !== post.slug; }).slice(0, 4);
    renderSidebar(post, others4);

    var sameCategory = others.filter(function (p) { return p.slug !== post.slug && p.category === post.category; }).slice(0, 3);
    if (sameCategory.length) {
      document.getElementById('pt-related-heading').textContent = 'More in ' + post.category;
      document.getElementById('pt-related').innerHTML = sameCategory.map(cardHtml).join('');
      document.getElementById('pt-related-wrap').hidden = false;
    }

    document.getElementById('post-root').hidden = false;
    if (window.initArticleEngagement) window.initArticleEngagement();
    if (window.initFaqAccordions) window.initFaqAccordions();
    document.dispatchEvent(new CustomEvent('stowflex:post-rendered'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var slug = getSlug();
    if (!slug) { document.getElementById('post-not-found').hidden = false; return; }
    Promise.all([B.fetchPostBySlug(slug), B.fetchPublishedPosts()]).then(function (r) {
      var post = r[0], others = r[1];
      if (!post) { document.getElementById('post-not-found').hidden = false; return; }
      render(post, others);
    });
  });
})();
