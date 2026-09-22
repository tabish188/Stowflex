// Blog admin connection settings. Fill in from Supabase > Project Settings > API.
// The anon key is public by design - it can only read published posts; every
// write needs the admin login (enforced by Row Level Security in setup.sql).
// Leave blank to enter them on the login screen instead (kept in this browser).
window.STOWFLEX_ADMIN = {
  supabaseUrl: 'https://ilfkslijjxuiexjyhevf.supabase.co',
  supabaseAnonKey: 'sb_publishable_XUC3AlQgniOu9u6EhnAb8Q_V5_e3LbC',
  loginDomain: 'admin.stowflex.com', // login ID "stowflex" signs in as stowflex@admin.stowflex.com
  siteUrl: 'https://www.stowflex.com'
};
