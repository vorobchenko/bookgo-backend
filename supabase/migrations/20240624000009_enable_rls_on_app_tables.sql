-- Backend uses direct Postgres (Express + pg). Block Supabase Data API roles.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE users FROM anon, authenticated;
REVOKE ALL ON TABLE pages FROM anon, authenticated;
REVOKE ALL ON TABLE page_profiles FROM anon, authenticated;
REVOKE ALL ON TABLE page_themes FROM anon, authenticated;
REVOKE ALL ON TABLE page_service_categories FROM anon, authenticated;
REVOKE ALL ON TABLE page_service_items FROM anon, authenticated;
REVOKE ALL ON TABLE page_availability FROM anon, authenticated;
REVOKE ALL ON TABLE page_blocks FROM anon, authenticated;
