-- Bookgo — полная схема БД (черновик на согласование)
-- users уже в 001_create_users.sql
-- schema_migrations создаётся runner'ом автоматически

-- =============================================================================
-- WORKSPACES
-- =============================================================================

CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name            VARCHAR(200) NOT NULL,
  kind            VARCHAR(50),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX workspaces_owner_user_id_idx ON workspaces (owner_user_id);

-- =============================================================================
-- WORKSPACE MEMBERS
-- =============================================================================

CREATE TABLE workspace_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL
                  CHECK (role IN ('owner', 'admin', 'editor')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX workspace_members_user_id_idx ON workspace_members (user_id);

-- =============================================================================
-- PAGES
-- =============================================================================

CREATE TABLE pages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id      UUID REFERENCES workspaces(id) ON DELETE SET NULL,
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
CREATE INDEX pages_workspace_id_idx ON pages (workspace_id);
CREATE INDEX pages_published_slug_idx ON pages (slug) WHERE published = true;
CREATE UNIQUE INDEX pages_one_default_per_user_idx ON pages (user_id) WHERE is_default = true;

-- =============================================================================
-- SERVICE CATEGORIES
-- =============================================================================

CREATE TABLE service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX service_categories_page_id_idx ON service_categories (page_id);

-- =============================================================================
-- PAGE SERVICES
-- =============================================================================

CREATE TABLE page_services (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id             UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  category_id         UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  title               VARCHAR(200) NOT NULL,
  subtitle            TEXT,
  duration_minutes    INTEGER NOT NULL,
  price_amount        INTEGER NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'PLN',
  price_hidden        BOOLEAN NOT NULL DEFAULT false,
  photo_url           VARCHAR(500),
  is_active           BOOLEAN NOT NULL DEFAULT true,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  legacy_settings_id  VARCHAR(64),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX page_services_page_id_active_idx ON page_services (page_id) WHERE is_active = true;

-- =============================================================================
-- AVAILABILITY RULES
-- =============================================================================

CREATE TABLE availability_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id             UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  weekday             SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  is_working          BOOLEAN NOT NULL DEFAULT false,
  is_bookable         BOOLEAN NOT NULL DEFAULT false,
  time_start          TIME,
  time_end            TIME,
  timezone            VARCHAR(64) NOT NULL DEFAULT 'UTC',
  buffer_before_min   INTEGER NOT NULL DEFAULT 0,
  buffer_after_min    INTEGER NOT NULL DEFAULT 0,
  min_notice_hours    INTEGER NOT NULL DEFAULT 0,
  max_days_ahead      INTEGER NOT NULL DEFAULT 60,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX availability_rules_page_weekday_idx ON availability_rules (page_id, weekday);

-- =============================================================================
-- CUSTOM QUESTIONS
-- =============================================================================

CREATE TABLE custom_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  label       VARCHAR(500) NOT NULL,
  type        VARCHAR(20) NOT NULL
              CHECK (type IN ('text', 'textarea', 'select')),
  required    BOOLEAN NOT NULL DEFAULT false,
  options     JSONB NOT NULL DEFAULT '[]',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX custom_questions_page_id_idx ON custom_questions (page_id);

-- =============================================================================
-- BOOKINGS
-- =============================================================================

CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id               UUID NOT NULL REFERENCES pages(id) ON DELETE RESTRICT,
  page_service_id       UUID NOT NULL REFERENCES page_services(id) ON DELETE RESTRICT,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  starts_at             TIMESTAMPTZ NOT NULL,
  ends_at               TIMESTAMPTZ NOT NULL,
  client_name           VARCHAR(200) NOT NULL,
  client_email          VARCHAR(255) NOT NULL,
  client_phone          VARCHAR(50),
  client_timezone       VARCHAR(64),
  price_amount          INTEGER NOT NULL,
  currency              CHAR(3) NOT NULL,
  notes                 TEXT,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX bookings_page_starts_idx ON bookings (page_id, starts_at);
CREATE INDEX bookings_service_starts_idx ON bookings (page_service_id, starts_at);
CREATE INDEX bookings_status_idx ON bookings (status);

-- =============================================================================
-- BOOKING ANSWERS
-- =============================================================================

CREATE TABLE booking_answers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  custom_question_id    UUID NOT NULL REFERENCES custom_questions(id) ON DELETE RESTRICT,
  value                 TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, custom_question_id)
);

-- =============================================================================
-- PAGE VIEWS
-- =============================================================================

CREATE TABLE page_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  referrer    TEXT,
  session_id  VARCHAR(64)
);

CREATE INDEX page_views_page_viewed_idx ON page_views (page_id, viewed_at);

-- =============================================================================
-- MEDIA ASSETS
-- =============================================================================

CREATE TABLE media_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id     UUID REFERENCES pages(id) ON DELETE SET NULL,
  url         VARCHAR(500) NOT NULL,
  kind        VARCHAR(20) NOT NULL
              CHECK (kind IN ('avatar', 'gallery', 'service_photo')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX media_assets_user_id_idx ON media_assets (user_id);
CREATE INDEX media_assets_page_id_idx ON media_assets (page_id);
