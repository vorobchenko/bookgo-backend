CREATE TABLE page_service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX page_service_categories_page_id_idx ON page_service_categories (page_id);

CREATE TABLE page_service_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id           UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES page_service_categories(id) ON DELETE SET NULL,
  title             VARCHAR(200) NOT NULL,
  subtitle          TEXT,
  duration_minutes  INTEGER NOT NULL,
  price_amount      INTEGER NOT NULL,
  currency          CHAR(3) NOT NULL DEFAULT 'PLN',
  price_hidden      BOOLEAN NOT NULL DEFAULT false,
  photo_url         VARCHAR(500),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX page_service_items_page_id_active_idx ON page_service_items (page_id) WHERE is_active = true;
