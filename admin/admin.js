(function () {
  'use strict';

  var CFG = window.STOWFLEX_ADMIN || {};
  var LS = { conn: 'sf-admin-conn', session: 'sf-admin-session' };
  var SITE = (CFG.siteUrl || 'https://www.stowflex.com').replace(/\/$/, '');

  var SERVICES = [
    { name: '', url: '' },
    { name: 'E-commerce Fulfillment', url: '/services-ecommerce-fulfillment' },
    { name: 'Warehousing & Distribution', url: '/services-warehousing-distribution' },
    { name: '3PL Logistics (FTL/PTL)', url: '/services-logistics' },
    { name: 'Asset Storage Solutions', url: '/services-asset-storage' }
  ];

  // Pages available to the internal-link picker / suggestions.
  var PAGES = [
    { label: 'E-commerce Fulfillment', url: '/services-ecommerce-fulfillment', kw: ['e-commerce fulfillment', 'ecommerce fulfillment', 'order fulfillment', 'pick and pack', 'returns management'] },
    { label: 'Warehousing & Distribution', url: '/services-warehousing-distribution', kw: ['warehousing', 'warehouse', 'distribution', 'storage'] },
    { label: '3PL Logistics', url: '/services-logistics', kw: ['3pl', 'logistics', 'transportation', 'ftl', 'ptl'] },
    { label: 'Asset Storage', url: '/services-asset-storage', kw: ['asset storage', 'non-performing', 'npa'] },
    { label: 'Case Studies', url: '/case-studies', kw: ['case studies', 'case study'] },
    { label: 'FAQ', url: '/faq', kw: ['faq', 'frequently asked'] },
    { label: 'Get a quote', url: '/faq#contact-form', kw: ['get a quote', 'contact us', 'free consultation'] },
    { label: 'About StowFlex', url: '/about', kw: ['about stowflex', 'our story'] }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var state = { posts: [], current: null, dirty: false, filter: 'all', session: null, slugTouched: false };

  // ---------- connection + session ----------
  function conn() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(LS.conn) || '{}'); } catch (e) {}
    return {
      url: (CFG.supabaseUrl || saved.url || '').replace(/\/$/, ''),
      key: CFG.supabaseAnonKey || saved.key || ''
    };
  }
  function loadSession() { try { return JSON.parse(localStorage.getItem(LS.session) || 'null'); } catch (e) { return null; } }
  function saveSession(s) { state.session = s; try { s ? localStorage.setItem(LS.session, JSON.stringify(s)) : localStorage.removeItem(LS.session); } catch (e) {} }

  function toast(msg, isError) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'adm-toast' + (isError ? ' error' : '');
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, isError ? 6000 : 3200);
  }

  function authHeaders(extra) {
    var c = conn();
    var h = { apikey: c.key, Authorization: 'Bearer ' + ((state.session && state.session.access_token) || c.key) };
    return Object.assign(h, extra || {});
  }

  function refreshIfNeeded() {
    var s = state.session;
    if (!s || !s.refresh_token) return Promise.resolve();
    if (s.expires_at && s.expires_at * 1000 - Date.now() > 60000) return Promise.resolve();
    var c = conn();
    return fetch(c.url + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: c.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { if (!r.ok) throw new Error('expired'); return r.json(); })
      .then(function (d) { saveSession(normSession(d)); });
  }
  function normSession(d) {
    return { access_token: d.access_token, refresh_token: d.refresh_token,
      expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600) };
  }

  function api(path, opts) {
    var c = conn();
    return refreshIfNeeded().then(function () {
      opts = opts || {};
      opts.headers = authHeaders(opts.headers);
      return fetch(c.url + path, opts);
    }).then(function (r) {
      if (r.status === 401) { doLogout(); throw new Error('Session expired - please sign in again.'); }
      if (!r.ok) return r.text().then(function (t) { throw new Error(explain(r.status, t)); });
      return r.status === 204 ? null : r.text().then(function (t) { return t ? JSON.parse(t) : null; });
    });
  }
  function explain(status, text) {
    try { var j = JSON.parse(text); if (j.code === '23505') return 'That URL slug is already used by another post.'; return j.message || j.error || text; } catch (e) { return text || ('Error ' + status); }
  }

  // ---------- login ----------
  function initLogin() {
    var c = conn();
    $('conn-url').value = c.url; $('conn-key').value = c.key;
    if (!c.url || !c.key) $('conn-details').open = true;

    $('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var url = $('conn-url').value.trim().replace(/\/$/, ''), key = $('conn-key').value.trim();
      if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) {
        try { localStorage.setItem(LS.conn, JSON.stringify({ url: url, key: key })); } catch (err) {}
      }
      var cc = conn(), err = $('login-error');
      err.hidden = true;
      if (!cc.url || !cc.key) { err.textContent = 'Add your Supabase URL and anon key under "Connection settings".'; err.hidden = false; $('conn-details').open = true; return; }
      var id = $('login-id').value.trim().toLowerCase();
      var email = id.indexOf('@') > -1 ? id : id + '@' + (CFG.loginDomain || 'admin.stowflex.com');
      var btn = $('login-submit'); btn.disabled = true; btn.textContent = 'Signing in...';
      fetch(cc.url + '/auth/v1/token?grant_type=password', {
        method: 'POST', headers: { apikey: cc.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: $('login-pass').value })
      }).then(function (r) {
        return r.json().then(function (d) { if (!r.ok) throw new Error(r.status === 400 ? 'Incorrect ID or password.' : (d.msg || d.message || 'Sign-in failed.')); return d; });
      }).then(function (d) {
        saveSession(normSession(d));
        $('login-pass').value = '';
        showApp();
      }).catch(function (ex) {
        err.textContent = ex.message === 'Failed to fetch' ? 'Could not reach Supabase. Check the project URL.' : ex.message;
        err.hidden = false;
      }).then(function () { btn.disabled = false; btn.textContent = 'Sign in'; });
    });
  }

  function doLogout() {
    saveSession(null);
    state.current = null;
    $('app').hidden = true; $('login').hidden = false;
  }

  function showApp() {
    $('login').hidden = true; $('app').hidden = false;
    loadList();
  }

  // ---------- list ----------
  function loadList() {
    return api('/rest/v1/posts?select=id,title,slug,status,category,tags,published_at,updated_at&order=updated_at.desc')
      .then(function (rows) { state.posts = rows || []; renderList(); fillCategories(); })
      .catch(function (e) { toast(e.message, true); });
  }
  function renderList() {
    var q = $('search').value.trim().toLowerCase();
    var ul = $('post-list'); ul.innerHTML = '';
    var rows = state.posts.filter(function (p) {
      if (state.filter !== 'all' && p.status !== state.filter) return false;
      return !q || (p.title + ' ' + p.slug).toLowerCase().indexOf(q) > -1;
    });
    $('list-empty').hidden = rows.length > 0;
    rows.forEach(function (p) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      if (state.current && state.current.id === p.id) b.className = 'is-active';
      var t = document.createElement('span'); t.className = 't'; t.textContent = p.title || '(untitled)';
      var m = document.createElement('span'); m.className = 'm';
      var bd = document.createElement('span'); bd.className = 'badge' + (p.status === 'published' ? ' pub' : ''); bd.textContent = p.status;
      var d = document.createElement('span'); d.textContent = (p.updated_at || '').slice(0, 10);
      m.appendChild(bd); m.appendChild(d);
      b.appendChild(t); b.appendChild(m);
      b.addEventListener('click', function () { confirmLeave(function () { openPost(p.id); }); });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  function fillCategories() {
    var set = {};
    state.posts.forEach(function (p) { if (p.category) set[p.category] = 1; });
    ['Warehousing', 'E-commerce', 'Logistics', 'Insight'].forEach(function (c) { set[c] = 1; });
    $('cat-list').innerHTML = Object.keys(set).map(function (c) { return '<option value="' + esc(c) + '">'; }).join('');
  }

  // ---------- editor ----------
  var F = {};
  function bindFields() {
    ['title', 'slug', 'excerpt', 'category', 'tags', 'author', 'date', 'image', 'imgpos', 'svc', 'body',
      'kw', 'mtitle', 'mdesc', 'canon', 'og', 'noindex'].forEach(function (k) { F[k] = $('f-' + k); });
    $('f-svc').innerHTML = SERVICES.map(function (s) { return '<option value="' + esc(s.url) + '">' + esc(s.name || 'None') + '</option>'; }).join('');
  }

  function blank() {
    return { id: null, title: '', slug: '', status: 'draft', excerpt: '', body: '', image: '', image_position: 'center',
      author: 'StowFlex Team', category: '', tags: [], related_service_name: '', related_service_url: '', focus_keyword: '',
      meta_title: '', meta_description: '', canonical_url: '', og_image: '', noindex: false, published_at: '' };
  }

  function newPost() {
    confirmLeave(function () { state.slugTouched = false; setCurrent(blank()); show('edit'); F.title.focus(); });
  }
  function openPost(id) {
    api('/rest/v1/posts?id=eq.' + encodeURIComponent(id) + '&select=*').then(function (rows) {
      if (!rows || !rows[0]) throw new Error('Post not found.');
      state.slugTouched = true;
      setCurrent(rows[0]); show('edit');
    }).catch(function (e) { toast(e.message, true); });
  }
  function show(view) { $('layout').setAttribute('data-view', view); window.scrollTo(0, 0); }

  function setCurrent(p) {
    state.current = p;
    $('empty-state').hidden = true; $('editor').hidden = false;
    F.title.value = p.title || ''; F.slug.value = p.slug || ''; F.excerpt.value = p.excerpt || '';
    F.category.value = p.category || ''; F.tags.value = (p.tags || []).join(', '); F.author.value = p.author || '';
    F.date.value = p.published_at || ''; F.image.value = p.image || ''; F.imgpos.value = p.image_position || 'center';
    F.svc.value = p.related_service_url || ''; F.body.value = p.body || '';
    F.kw.value = p.focus_keyword || ''; F.mtitle.value = p.meta_title || ''; F.mdesc.value = p.meta_description || '';
    F.canon.value = p.canonical_url || ''; F.og.value = p.og_image || ''; F.noindex.checked = !!p.noindex;
    setDirty(false); switchTab('content'); refreshAll(); renderList();
  }

  function collect() {
    var svc = SERVICES.filter(function (s) { return s.url === F.svc.value; })[0] || SERVICES[0];
    return Object.assign({}, state.current, {
      title: F.title.value.trim(), slug: F.slug.value.trim(), excerpt: F.excerpt.value.trim(), body: F.body.value,
      category: F.category.value.trim() || 'Insight',
      tags: F.tags.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
      author: F.author.value.trim() || 'StowFlex Team', published_at: F.date.value || null,
      image: F.image.value.trim(), image_position: F.imgpos.value,
      related_service_name: svc.name || null, related_service_url: svc.url || null,
      focus_keyword: F.kw.value.trim(), meta_title: F.mtitle.value.trim(), meta_description: F.mdesc.value.trim(),
      canonical_url: F.canon.value.trim(), og_image: F.og.value.trim(), noindex: F.noindex.checked
    });
  }

  function setDirty(v) { state.dirty = v; $('dirty').hidden = !v; }
  function confirmLeave(fn) {
    if (state.dirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    setDirty(false); fn();
  }

  function slugify(s) {
    return s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  }

  function validate(p, publishing) {
    if (!p.title) return 'Add a title.';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) return 'The URL slug must use lowercase letters, numbers and single hyphens only.';
    if (publishing && !p.body.trim()) return 'Write some content before publishing.';
    return '';
  }

  function save(status) {
    var p = collect();
    var publishing = status === 'published';
    p.status = status;
    if (publishing && !p.published_at) { p.published_at = new Date().toISOString().slice(0, 10); F.date.value = p.published_at; }
    var bad = validate(p, publishing);
    if (bad) { toast(bad, true); return; }
    var payload = Object.assign({}, p); delete payload.id; delete payload.created_at; delete payload.updated_at;
    var req = p.id
      ? api('/rest/v1/posts?id=eq.' + encodeURIComponent(p.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(payload) })
      : api('/rest/v1/posts', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(payload) });
    setBusy(true);
    req.then(function (rows) {
      var row = Array.isArray(rows) ? rows[0] : rows;
      state.slugTouched = true;
      setCurrent(row);
      toast(publishing ? 'Published.' : 'Saved as draft.');
      return loadList();
    }).catch(function (e) { toast(e.message, true); }).then(function () { setBusy(false); });
  }
  function setBusy(b) { ['btn-save', 'btn-publish', 'btn-unpublish', 'btn-delete'].forEach(function (id) { $(id).disabled = b; }); }

  function del() {
    var p = state.current;
    if (!p) return;
    if (!p.id) { setDirty(false); state.current = null; $('editor').hidden = true; $('empty-state').hidden = false; show('list'); return; }
    if (!window.confirm('Delete "' + (p.title || 'this post') + '" permanently? This cannot be undone.')) return;
    api('/rest/v1/posts?id=eq.' + encodeURIComponent(p.id), { method: 'DELETE' }).then(function () {
      state.current = null; setDirty(false);
      $('editor').hidden = true; $('empty-state').hidden = false; show('list');
      toast('Post deleted.');
      return loadList();
    }).catch(function (e) { toast(e.message, true); });
  }

  // ---------- uploads ----------
  function upload(file) {
    if (!file) return Promise.reject(new Error('No file'));
    if (file.size > 5 * 1024 * 1024) return Promise.reject(new Error('Image must be under 5 MB.'));
    var name = Date.now() + '-' + file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    var c = conn();
    return refreshIfNeeded().then(function () {
      return fetch(c.url + '/storage/v1/object/blog-images/' + name, {
        method: 'POST', headers: authHeaders({ 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' }), body: file
      });
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('Upload failed: ' + explain(r.status, t)); });
      return c.url + '/storage/v1/object/public/blog-images/' + name;
    });
  }

  // ---------- markdown (mirrors build-blog.js so the preview matches the site) ----------
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function inline(t) {
    t = esc(t);
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    return t.replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  function md(src) {
    var lines = src.replace(/\r\n/g, '\n').split('\n'), out = [], i = 0;
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
          items.push('<details open style="margin:8px 0;border:1px solid #d5dbea;border-radius:8px;padding:10px 14px"><summary style="font-weight:600;cursor:pointer">' + inline(qm[1]) + '</summary><p>' + inline(a.join(' ')) + '</p></details>');
          while (i < lines.length && !lines[i].trim()) i++;
        }
        out.push(items.join('')); continue;
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

  // ---------- toolbar ----------
  function wrapSel(before, after, placeholder) {
    var ta = F.body, s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e) || placeholder;
    ta.setRangeText(before + sel + after, s, e, 'end');
    ta.focus(); ta.selectionStart = s + before.length; ta.selectionEnd = s + before.length + sel.length; onEdit();
  }
  function linePrefix(prefix) {
    var ta = F.body, s = ta.selectionStart, start = ta.value.lastIndexOf('\n', s - 1) + 1;
    ta.setRangeText(prefix, start, start, 'end'); ta.focus(); onEdit();
  }
  function insertBlock(text) {
    var ta = F.body, s = ta.selectionEnd, pre = ta.value.slice(0, s), need = pre && !/\n\n$/.test(pre) ? (/\n$/.test(pre) ? '\n' : '\n\n') : '';
    ta.setRangeText(need + text + '\n\n', s, s, 'end'); ta.focus(); onEdit();
  }
  function toolbar(act) {
    if (act === 'h2') linePrefix('## ');
    else if (act === 'h3') linePrefix('### ');
    else if (act === 'bold') wrapSel('**', '**', 'bold text');
    else if (act === 'italic') wrapSel('*', '*', 'italic text');
    else if (act === 'ul') linePrefix('- ');
    else if (act === 'ol') linePrefix('1. ');
    else if (act === 'quote') linePrefix('> ');
    else if (act === 'link') { var u = window.prompt('Link URL (https://... or /page):'); if (u) wrapSel('[', '](' + u + ')', 'link text'); }
    else if (act === 'internal') pickInternal();
    else if (act === 'image') $('f-inline-upload').click();
    else if (act === 'faq') insertBlock('## Frequently Asked Questions\n\nQ: Your first question?\nA: Your answer.\n\nQ: Your second question?\nA: Your answer.');
  }
  function pickInternal() {
    var opts = PAGES.map(function (p, i) { return (i + 1) + '. ' + p.label; });
    state.posts.filter(function (p) { return p.status === 'published' && (!state.current || p.id !== state.current.id); })
      .forEach(function (p) { opts.push((opts.length + 1) + '. Blog: ' + p.title); });
    var n = window.prompt('Link to which page? Enter a number:\n\n' + opts.join('\n'));
    var idx = parseInt(n, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= opts.length) return;
    var url = idx < PAGES.length ? PAGES[idx].url : '/blog/' + state.posts.filter(function (p) { return p.status === 'published' && (!state.current || p.id !== state.current.id); })[idx - PAGES.length].slug;
    wrapSel('[', '](' + url + ')', idx < PAGES.length ? PAGES[idx].label : 'related article');
  }

  // ---------- link suggestions ----------
  function suggestions() {
    var body = F.body.value, low = body.toLowerCase(), list = [];
    var targets = PAGES.map(function (p) { return { label: p.label, url: p.url, kw: p.kw }; });
    state.posts.forEach(function (p) {
      if (p.status !== 'published' || (state.current && p.id === state.current.id)) return;
      var kw = (p.tags || []).concat(p.category ? [p.category] : []).filter(function (k) { return k && k.length > 3; });
      targets.push({ label: 'Blog: ' + p.title, url: '/blog/' + p.slug, kw: kw });
    });
    targets.forEach(function (t) {
      if (body.indexOf('](' + t.url + ')') > -1) return;
      for (var i = 0; i < t.kw.length; i++) {
        var re = new RegExp('(^|[^\\w\\[/-])(' + t.kw[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\w\\]-])', 'i');
        var lines = body.split('\n'), off = 0, hit = null;
        for (var l = 0; l < lines.length && !hit; l++) {
          if (!/^#|^Q:|^A:/.test(lines[l]) && !/\]\([^)]*$/.test(lines[l])) {
            var m = re.exec(lines[l]);
            if (m && lines[l].slice(0, m.index + m[1].length).split('[').length === lines[l].slice(0, m.index + m[1].length).split(']').length) {
              hit = { at: off + m.index + m[1].length, text: m[2] };
            }
          }
          off += lines[l].length + 1;
        }
        if (hit) { list.push({ target: t, hit: hit, count: (low.match(new RegExp(t.kw[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length }); return; }
      }
    });
    return list;
  }
  function renderSuggestions() {
    var ul = $('suggest-list'), s = suggestions(); ul.innerHTML = '';
    if (!s.length) { ul.innerHTML = '<li><span class="muted">No new suggestions - your text is linked well, or add more service-related wording.</span></li>'; return; }
    s.slice(0, 6).forEach(function (x) {
      var li = document.createElement('li'), sp = document.createElement('span'), b = document.createElement('button');
      sp.innerHTML = '<strong>' + esc(x.target.label) + '</strong> &mdash; "' + esc(x.hit.text) + '" mentioned ' + x.count + '&times;';
      b.type = 'button'; b.className = 'adm-btn'; b.textContent = 'Link it';
      b.addEventListener('click', function () {
        F.body.setRangeText('[' + x.hit.text + '](' + x.target.url + ')', x.hit.at, x.hit.at + x.hit.text.length, 'end');
        onEdit();
      });
      li.appendChild(sp); li.appendChild(b); ul.appendChild(li);
    });
  }

  // ---------- SEO ----------
  function rating(len, min, max) { return len === 0 ? 'bad' : (len >= min && len <= max ? 'ok' : 'warn'); }
  function setCounter(id, len, min, max) { var el = $(id); el.textContent = len + ' chars'; el.className = 'counter ' + rating(len, min, max); }

  function updateSeo() {
    var p = collect(), title = p.meta_title || (p.title ? p.title + ' | StowFlex Blog' : '');
    var desc = p.meta_description || p.excerpt;
    setCounter('mtitle-count', (p.meta_title || '').length, 30, 60);
    setCounter('mdesc-count', (p.meta_description || '').length, 70, 160);
    $('excerpt-count').textContent = p.excerpt.length + ' chars';
    $('serp-url').textContent = SITE.replace('https://', '') + ' › blog › ' + (p.slug || 'your-post');
    $('serp-title').textContent = title.slice(0, 70) || 'Your title appears here';
    $('serp-desc').textContent = (desc || 'Add a meta description or excerpt.').slice(0, 165);
    $('slug-url').textContent = SITE.replace('https://', '') + '/blog/' + (p.slug || '...');

    var words = p.body.trim() ? p.body.trim().split(/\s+/).length : 0;
    $('wordcount').textContent = words + ' words';
    var kw = p.focus_keyword.toLowerCase(), firstPara = (p.body.split(/\n\s*\n/).filter(function (x) { return x.trim() && !/^#/.test(x.trim()); })[0] || '').toLowerCase();
    var h2 = (p.body.match(/^##\s/gm) || []).length;
    var internal = (p.body.match(/\]\((\/[^)]*|https?:\/\/(www\.)?stowflex\.com[^)]*)\)/g) || []).length;
    var checks = [
      ['Title is 30-60 characters', rating((p.meta_title || p.title).length, 30, 60)],
      ['Meta description is 70-160 characters', rating((p.meta_description || p.excerpt).length, 70, 160)],
      ['URL slug is short and readable (under 60 chars)', p.slug ? (p.slug.length <= 60 ? 'ok' : 'warn') : 'bad'],
      ['Article has 600+ words (' + words + ')', words >= 600 ? 'ok' : (words >= 300 ? 'warn' : 'bad')],
      ['Uses at least 2 section headings (H2) (' + h2 + ')', h2 >= 2 ? 'ok' : (h2 === 1 ? 'warn' : 'bad')],
      ['Links to at least 2 pages on the site (' + internal + ')', internal >= 2 ? 'ok' : (internal === 1 ? 'warn' : 'bad')],
      ['Cover image is set', p.image ? 'ok' : 'bad'],
      ['Has an FAQ block (helps rich results)', /^Q:\s/m.test(p.body) ? 'ok' : 'warn']
    ];
    if (kw) {
      var dens = words ? ((p.body.toLowerCase().split(kw).length - 1) / words * 100) : 0;
      checks.push(['Focus keyword in title', (p.title + ' ' + p.meta_title).toLowerCase().indexOf(kw) > -1 ? 'ok' : 'bad']);
      checks.push(['Focus keyword in meta description / excerpt', desc.toLowerCase().indexOf(kw) > -1 ? 'ok' : 'warn']);
      checks.push(['Focus keyword in URL slug', p.slug.indexOf(kw.replace(/\s+/g, '-')) > -1 ? 'ok' : 'warn']);
      checks.push(['Focus keyword in the first paragraph', firstPara.indexOf(kw) > -1 ? 'ok' : 'warn']);
      checks.push(['Keyword density ' + dens.toFixed(1) + '% (aim for 0.5-2.5%)', dens >= 0.5 && dens <= 2.5 ? 'ok' : 'warn']);
    } else checks.push(['Set a focus keyword to unlock keyword checks', 'warn']);

    var pts = 0; checks.forEach(function (c) { pts += c[1] === 'ok' ? 1 : (c[1] === 'warn' ? 0.5 : 0); });
    var score = Math.round(pts / checks.length * 100), sc = $('seo-score');
    sc.textContent = score; sc.className = 'score ' + (score >= 80 ? 'ok' : (score >= 50 ? 'mid' : ''));
    $('seo-checks').innerHTML = checks.map(function (c) { return '<li class="' + c[1] + '"><span class="dot"></span><span>' + esc(c[0]) + '</span></li>'; }).join('');
  }

  function updatePreview() {
    var p = collect();
    $('pv-title').textContent = p.title || 'Untitled';
    $('pv-meta').textContent = [p.category, p.author, p.published_at].filter(Boolean).join(' · ');
    var img = $('pv-cover');
    if (p.image) { img.src = /^https?:|^data:/.test(p.image) ? p.image : '..' + (p.image.charAt(0) === '/' ? '' : '/') + p.image; img.hidden = false; } else img.hidden = true;
    $('pv-body').innerHTML = md(p.body);
  }

  function updateCover() {
    var v = F.image.value.trim(), el = $('cover-preview');
    if (!v) { el.hidden = true; return; }
    el.src = /^https?:|^data:/.test(v) ? v : '..' + (v.charAt(0) === '/' ? '' : '/') + v; el.hidden = false;
  }

  function updateStatus() {
    var pub = state.current && state.current.status === 'published';
    var b = $('status-badge'); b.textContent = pub ? 'Published' : 'Draft'; b.className = 'badge' + (pub ? ' pub' : '');
    $('btn-unpublish').hidden = !pub;
    $('btn-publish').textContent = pub ? 'Update & publish' : 'Publish';
    $('btn-delete').textContent = state.current && state.current.id ? 'Delete' : 'Discard';
  }

  function refreshAll() { updateStatus(); updateSeo(); updateCover(); renderSuggestions(); updatePreview(); }
  var t; function onEdit() { setDirty(true); clearTimeout(t); t = setTimeout(refreshAll, 200); }

  function switchTab(name) {
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('is-active', b.dataset.tab === name); });
    document.querySelectorAll('.pane').forEach(function (p) { p.hidden = p.dataset.pane !== name; });
    if (name === 'preview') updatePreview();
  }

  // ---------- wiring ----------
  function init() {
    bindFields(); initLogin();

    $('btn-new').addEventListener('click', newPost);
    $('btn-logout').addEventListener('click', function () { confirmLeave(doLogout); });
    $('btn-back').addEventListener('click', function () { confirmLeave(function () { show('list'); }); });
    $('btn-save').addEventListener('click', function () { save('draft'); });
    $('btn-publish').addEventListener('click', function () { save('published'); });
    $('btn-unpublish').addEventListener('click', function () { save('draft'); });
    $('btn-delete').addEventListener('click', del);
    $('search').addEventListener('input', renderList);
    document.querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        state.filter = c.dataset.filter;
        document.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('is-active', x === c); });
        renderList();
      });
    });
    document.querySelectorAll('.tab').forEach(function (b) { b.addEventListener('click', function () { switchTab(b.dataset.tab); }); });
    $('toolbar').addEventListener('click', function (e) { var b = e.target.closest('button[data-act]'); if (b) toolbar(b.dataset.act); });

    $('editor').addEventListener('input', function (e) {
      if (e.target === F.slug) { state.slugTouched = true; F.slug.value = F.slug.value.toLowerCase().replace(/\s+/g, '-'); }
      if (e.target === F.title && !state.slugTouched && !(state.current && state.current.id)) F.slug.value = slugify(F.title.value);
      onEdit();
    });
    $('editor').addEventListener('change', onEdit);
    $('editor').addEventListener('submit', function (e) { e.preventDefault(); });

    $('f-upload').addEventListener('change', function () {
      var f = this.files[0]; this.value = '';
      toast('Uploading...');
      upload(f).then(function (url) { F.image.value = url; onEdit(); toast('Image uploaded.'); }).catch(function (e) { toast(e.message, true); });
    });
    $('f-inline-upload').addEventListener('change', function () {
      var f = this.files[0]; this.value = '';
      toast('Uploading...');
      upload(f).then(function (url) { wrapSel('![', '](' + url + ')', 'describe the image'); toast('Image inserted.'); }).catch(function (e) { toast(e.message, true); });
    });

    window.addEventListener('beforeunload', function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

    state.session = loadSession();
    if (state.session && conn().url) showApp();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
