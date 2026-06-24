-- Bookgo — упрощённая схема (рекомендуемая)
-- users: 001_create_users.sql
-- schema_migrations: runner

-- =============================================================================
-- PAGES — единственная таблица витрины
-- Всё из builder (услуги, расписание, faq, блоки) — в settings JSONB
-- =============================================================================

CREATE TABLE pages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  slug              VARCHAR(64) NOT NULL UNIQUE,
  published         BOOLEAN NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,

  settings          JSONB NOT NULL DEFAULT '{}',
  settings_version  INTEGER NOT NULL DEFAULT 1,
  is_default        BOOLEAN NOT NULL DEFAULT false,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pages_user_id_idx ON pages (user_id);
CREATE INDEX pages_published_slug_idx ON pages (slug) WHERE published = true;
CREATE UNIQUE INDEX pages_one_default_per_user_idx ON pages (user_id) WHERE is_default = true;
