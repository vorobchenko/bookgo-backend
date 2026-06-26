-- Remove style preset (neon / pastel / bold) from page themes.

ALTER TABLE page_themes
  DROP CONSTRAINT IF EXISTS page_themes_preset_check;

ALTER TABLE page_themes
  DROP COLUMN IF EXISTS preset;
