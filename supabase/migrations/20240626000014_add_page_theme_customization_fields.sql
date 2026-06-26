-- Theme: font, element corners, and page background customization.

ALTER TABLE page_themes
  ADD COLUMN IF NOT EXISTS font_preset VARCHAR(20) NOT NULL DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS element_style VARCHAR(20) NOT NULL DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS background JSONB NOT NULL DEFAULT '{"type":"preset"}'::jsonb;

ALTER TABLE page_themes
  DROP CONSTRAINT IF EXISTS page_themes_font_preset_check;

ALTER TABLE page_themes
  ADD CONSTRAINT page_themes_font_preset_check
  CHECK (font_preset IN ('neutral', 'sport', 'editorial'));

ALTER TABLE page_themes
  DROP CONSTRAINT IF EXISTS page_themes_element_style_check;

ALTER TABLE page_themes
  ADD CONSTRAINT page_themes_element_style_check
  CHECK (element_style IN ('rounded', 'sharp', 'pill'));
