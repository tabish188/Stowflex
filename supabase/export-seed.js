// Turns the Markdown posts in content/blog into supabase/seed.sql so they can
// be edited from the admin panel. Run: node supabase/export-seed.js
// then paste supabase/seed.sql into Supabase > SQL Editor. Safe to re-run
// (existing slugs are left untouched).
'use strict';
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'content', 'blog');
const q = (s) => "'" + String(s == null ? '' : s).replace(/'/g, "''") + "'";

function parse(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const data = {};
  if (!m) return { data, body: raw };
  m[1].split(/\r?\n/).forEach((line) => {
    const i = line.indexOf(':');
    if (i === -1) return;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    data[k] = v.startsWith('[') ? v.slice(1, -1).split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
      : v.replace(/^["']|["']$/g, '');
  });
  return { data, body: m[2] };
}

const out = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((file) => {
  const { data, body } = parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const slug = data.slug || file.replace(/\.md$/, '');
  const tags = 'array[' + (data.tags || []).map(q).join(',') + ']::text[]';
  const svc = data.relatedServiceUrl ? String(data.relatedServiceUrl).replace(/\.html$/, '') : '';
  return `insert into public.posts (slug, title, status, excerpt, body, image, image_position, author, category, tags, related_service_name, related_service_url, published_at)
values (${q(slug)}, ${q(data.title || slug)}, 'published', ${q(data.excerpt)}, ${q(body.trim())}, ${q(data.image)}, ${q(data.imagePosition || 'center')}, ${q(data.author || 'StowFlex Team')}, ${q(data.category || 'Insight')}, ${tags}, ${q(data.relatedServiceName)}, ${q(svc)}, ${q(data.date)})
on conflict (slug) do nothing;`;
}).join('\n\n');

fs.writeFileSync(path.join(__dirname, 'seed.sql'), out + '\n');
console.log('Wrote supabase/seed.sql');
