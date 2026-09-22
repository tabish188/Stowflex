// Public Supabase connection - used by every page (forms, blog listing, blog posts).
// The anon key is public by design (safe to ship in client JS): it can only
// insert leads and read published blog posts, enforced by Row Level Security
// in supabase/setup.sql. Nothing else on the site talks to a backend anymore.
window.STOWFLEX_SUPABASE = {
  url: 'https://ilfkslijjxuiexjyhevf.supabase.co',
  anonKey: 'sb_publishable_XUC3AlQgniOu9u6EhnAb8Q_V5_e3LbC'
};
