-- Allow any font preset token (frontend-defined), not only neutral/sport/editorial.

ALTER TABLE page_themes
  DROP CONSTRAINT IF EXISTS page_themes_font_preset_check;

ALTER TABLE page_themes
  ALTER COLUMN font_preset TYPE VARCHAR(64);
