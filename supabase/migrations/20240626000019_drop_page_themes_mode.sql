-- Remove color mode (light / dark / auto) from page themes.

ALTER TABLE page_themes
  DROP CONSTRAINT IF EXISTS page_themes_mode_check;

ALTER TABLE page_themes
  DROP COLUMN IF EXISTS mode;
