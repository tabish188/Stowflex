#!/usr/bin/env node
// Regenerates sitemap.xml with the static pages + every published blog post
// currently in Supabase. Run this locally whenever you want the sitemap to
// reflect the latest posts, then re-upload sitemap.xml to Hostinger.
//   node generate-sitemap.js
'use strict';

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.stowflex.com';
const SUPABASE_URL = 'https://ilfkslijjxuiexjyhevf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XUC3AlQgniOu9u6EhnAb8Q_V5_e3LbC';

const STATIC_PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/about', priority: '0.8', changefreq: 'monthly' },
  { loc: '/services', priority: '0.9', changefreq: 'monthly' },
  { loc: '/services-ecommerce-fulfillment', priority: '0.85', changefreq: 'monthly' },
  { loc: '/services-warehousing-distribution', priority: '0.85', changefreq: 'monthly' },
  { loc: '/services-logistics', priority: '0.85', changefreq: 'monthly' },
  { loc: '/services-asset-storage', priority: '0.85', changefreq: 'monthly' },
  { loc: '/case-studies', priority: '0.9', changefreq: 'monthly' },
  { loc: '/blog', priority: '0.8', changefreq: 'weekly' },
  { loc: '/faq', priority: '0.7', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.7', changefreq: 'yearly' }
];

async function fetchPublishedSlugs() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/posts?status=eq.published&noindex=eq.false&select=slug,updated_at', {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
  });
  if (!res.ok) throw new Error('Supabase fetch failed: HTTP ' + res.status);
  return res.json();
}

function urlEntry(loc, extra) {
  extra = extra || {};
  let xml = '  <url><loc>' + SITE_URL + loc + '</loc>';
  if (extra.lastmod) xml += '<lastmod>' + extra.lastmod + '</lastmod>';
  xml += '<priority>' + extra.priority + '</priority>';
  if (extra.changefreq) xml += '<changefreq>' + extra.changefreq + '</changefreq>';
  xml += '</url>';
  return xml;
}

async function main() {
  const posts = await fetchPublishedSlugs();
  const urls = STATIC_PAGES.map((p) => urlEntry(p.loc, p))
    .concat(posts.map((p) => urlEntry('/blog/' + p.slug, {
      priority: '0.6', changefreq: 'monthly', lastmod: (p.updated_at || '').slice(0, 10)
    })));

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.join('\n') + '\n</urlset>\n';

  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml);
  console.log('sitemap.xml written: ' + STATIC_PAGES.length + ' static page(s) + ' + posts.length + ' blog post(s).');
}

main().catch((e) => { console.error(e); process.exit(1); });
