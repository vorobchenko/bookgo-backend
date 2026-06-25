-- Page public profile uses language, not timezone (schedule timezone stays on page_availability).

ALTER TABLE page_profiles
  ADD COLUMN IF NOT EXISTS lang VARCHAR(5);

UPDATE page_profiles pp
SET lang = u.lang
FROM pages p
JOIN users u ON u.id = p.user_id
WHERE pp.page_id = p.id
  AND (pp.lang IS NULL OR pp.lang = '');

UPDATE page_profiles
SET lang = 'en'
WHERE lang IS NULL OR lang NOT IN ('en', 'ru');

ALTER TABLE page_profiles
  ALTER COLUMN lang SET DEFAULT 'en',
  ALTER COLUMN lang SET NOT NULL;

ALTER TABLE page_profiles
  ADD CONSTRAINT page_profiles_lang_check CHECK (lang IN ('en', 'ru'));

ALTER TABLE page_profiles
  DROP COLUMN timezone;
