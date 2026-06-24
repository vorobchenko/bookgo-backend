CREATE TABLE pages (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  slug                    VARCHAR(64) NOT NULL UNIQUE,
  published               BOOLEAN NOT NULL DEFAULT false,
  published_at            TIMESTAMPTZ,
  is_default              BOOLEAN NOT NULL DEFAULT false,
  settings_version        INTEGER NOT NULL DEFAULT 1,

  services_use_categories BOOLEAN NOT NULL DEFAULT false,
  section_layout          JSONB NOT NULL DEFAULT '[]',

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX pages_one_default_per_user_idx
  ON pages (user_id)
  WHERE is_default = true;

CREATE INDEX pages_user_id_idx ON pages (user_id);
CREATE INDEX pages_published_slug_idx ON pages (slug) WHERE published = true;
