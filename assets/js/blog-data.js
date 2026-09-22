// Shared blog rendering used by blog.html (listing) and blog/post.html (article).
// Posts live only in Supabase now - published here, they appear here, with no
// build step in between. Publishing/deleting from /admin is instant.
(function () {
  'use strict';

  var CFG = window.STOWFLEX_SUPABASE || {};
  var SITE_URL = 'https://www.stowflex.com';
  var SITE_NAME = 'StowFlex by StowNest';

  var SERVICE_URL_MAP = {
    'services-ecommerce-fulfillment': true, 'services-warehousing-distribution': true,
    'services-logistics': true, 'services-asset-storage': true
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function inline(t) {
    t = esc(t);
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    return t.replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function markdownToHtml(md) {
    var lines = String(md || '').replace(/\r\n/g, '\n').split('\n'), out = [], i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (!line.trim()) { i++; continue; }
      var h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) { out.push('<h' + (h[1].length + 1) + '>' + inline(h[2]) + '</h' + (h[1].length + 1) + '>'); i++; continue; }
      if (/^Q:\s*/.test(line)) {
        var items = [];
        while (i < lines.length) {
          var qm = lines[i].match(/^Q:\s*(.*)$/); if (!qm) break; i++;
          var a = [];
          while (i < lines.length && lines[i].trim() && !/^Q:\s*/.test(lines[i])) { var am = lines[i].match(/^A:\s*(.*)$/); a.push(am ? am[1] : lines[i]); i++; }
          items.push({ q: qm[1], a: a.join(' ') });
          while (i < lines.length && !lines[i].trim()) i++;
        }
        var itemsHtml = items.map(function (it, idx) {
          return '<div class="accordion-item" data-open="' + (idx === 0 ? 'true' : 'false') + '">' +
            '<button class="accordion-trigger" aria-expanded="' + (idx === 0 ? 'true' : 'false') + '">' +
            '<span>' + inline(it.q) + '</span><svg class="icon" aria-hidden="true"><use href="#i-chevron-down"></use></svg></button>' +
            '<div class="accordion-panel"><div class="inner">' + inline(it.a) + '</div></div></div>';
        }).join('');
        out.push('<div class="faq-section article-faq">' + itemsHtml + '</div>');
        continue;
      }
      if (/^>\s?/.test(line)) { var q = []; while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; } out.push('<blockquote><p>' + inline(q.join(' ')) + '</p></blockquote>'); continue; }
      if (/^[-*]\s+/.test(line)) { var u = []; while (i < lines.length && /^[-*]\s+/.test(lines[i])) { u.push(lines[i].replace(/^[-*]\s+/, '')); i++; } out.push('<ul>' + u.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>'); continue; }
      if (/^\d+\.\s+/.test(line)) { var o = []; while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { o.push(lines[i].replace(/^\d+\.\s+/, '')); i++; } out.push('<ol>' + o.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ol>'); continue; }
      var para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4})\s|^[-*]\s|^\d+\.\s|^>\s?/.test(lines[i])) { para.push(lines[i]); i++; }
      out.push('<p>' + inline(para.join(' ')) + '</p>');
    }
    return out.join('\n');
  }

  function readingTime(md) { var words = String(md || '').trim().split(/\s+/).length; return Math.max(1, Math.round(words / 200)); }
  function formatDate(dateStr) { var d = new Date(dateStr); if (isNaN(d)) return dateStr; return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }); }
  function relImg(src) { return /^https?:/.test(src || '') ? src : ('/' + String(src || '').replace(/^\//, '')); }
  function svcPath(url) { return String(url || '').replace(/\.html$/, '').replace(/^\//, ''); }

  function normalize(r) {
    return {
      title: r.title, slug: r.slug, body: r.body || '',
      date: (r.published_at || r.created_at || '1970-01-01').slice(0, 10),
      excerpt: r.excerpt || '', image: r.image || '/assets/img/blog/placeholder-warehousing.svg',
      imagePosition: r.image_position || 'center', author: r.author || SITE_NAME,
      tags: r.tags || [], category: r.category || (r.tags && r.tags[0]) || 'Insight',
      relatedServiceName: r.related_service_name || null, relatedServiceUrl: r.related_service_url || null,
      metaTitle: r.meta_title || '', metaDescription: r.meta_description || '',
      canonicalUrl: r.canonical_url || '', ogImage: r.og_image || '', noindex: !!r.noindex
    };
  }

  function fetchPublishedPosts() {
    if (!CFG.url || !CFG.anonKey) return Promise.resolve([]);
    return fetch(CFG.url.replace(/\/$/, '') + '/rest/v1/posts?status=eq.published&select=*&order=published_at.desc', {
      headers: { apikey: CFG.anonKey, Authorization: 'Bearer ' + CFG.anonKey }
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (rows) { return rows.map(normalize).sort(function (a, b) { return new Date(b.date) - new Date(a.date); }); })
      .catch(function (e) { console.warn('Blog: could not load posts (' + e.message + ')'); return []; });
  }

  function fetchPostBySlug(slug) {
    if (!CFG.url || !CFG.anonKey) return Promise.resolve(null);
    return fetch(CFG.url.replace(/\/$/, '') + '/rest/v1/posts?status=eq.published&slug=eq.' + encodeURIComponent(slug) + '&select=*', {
      headers: { apikey: CFG.anonKey, Authorization: 'Bearer ' + CFG.anonKey }
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (rows) { return rows && rows[0] ? normalize(rows[0]) : null; });
  }

  window.StowflexBlog = {
    esc: esc, inline: inline, markdownToHtml: markdownToHtml, readingTime: readingTime,
    formatDate: formatDate, relImg: relImg, svcPath: svcPath, SITE_URL: SITE_URL, SITE_NAME: SITE_NAME,
    fetchPublishedPosts: fetchPublishedPosts, fetchPostBySlug: fetchPostBySlug
  };
})();
