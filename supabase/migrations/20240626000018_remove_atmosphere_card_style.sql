-- Remove card_style (solid/glass) from theme atmosphere.

UPDATE page_themes
SET atmosphere = atmosphere - 'card_style'
WHERE atmosphere ? 'card_style';

ALTER TABLE page_themes
  ALTER COLUMN atmosphere SET DEFAULT '{"grain":false,"grain_intensity":0.12}'::jsonb;
