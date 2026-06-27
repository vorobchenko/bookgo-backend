-- Theme v2: brand colors, CTA, atmosphere.

ALTER TABLE page_themes
  ADD COLUMN IF NOT EXISTS secondary_color varchar(7) NOT NULL DEFAULT '#b4dd2f',
  ADD COLUMN IF NOT EXISTS surface_color varchar(7) NOT NULL DEFAULT '#1a1a1a',
  ADD COLUMN IF NOT EXISTS text_color varchar(7) NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS text_muted_color varchar(7) NOT NULL DEFAULT '#8a8a8a',
  ADD COLUMN IF NOT EXISTS cta jsonb NOT NULL DEFAULT '{"variant":"solid","size":"default","label_case":"uppercase"}'::jsonb,
  ADD COLUMN IF NOT EXISTS atmosphere jsonb NOT NULL DEFAULT '{"grain":false,"grain_intensity":0.12,"card_style":"solid"}'::jsonb;

-- Migrate legacy background.type=preset to solid.
UPDATE page_themes
SET background = jsonb_build_object(
  'type', 'solid',
  'color', '#0a0a0a',
  'overlay_color', '#000000',
  'overlay_opacity', 0
)
WHERE background->>'type' = 'preset' OR background IS NULL;

ALTER TABLE page_themes
  ALTER COLUMN background SET DEFAULT '{"type":"solid","color":"#0a0a0a","overlay_color":"#000000","overlay_opacity":0}'::jsonb;
