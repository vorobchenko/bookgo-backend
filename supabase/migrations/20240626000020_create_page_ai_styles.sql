CREATE TABLE page_ai_styles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id          uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  batch_id         uuid NOT NULL,
  tone             varchar(8) NOT NULL CHECK (tone IN ('dark', 'light')),
  label            varchar(80) NOT NULL,
  description      varchar(200) NOT NULL,
  confidence       real,
  source_image_url text NOT NULL,
  hint             text,
  theme            jsonb NOT NULL,
  is_active        boolean NOT NULL DEFAULT false,
  applied_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX page_ai_styles_page_id_created_at_idx
  ON page_ai_styles (page_id, created_at DESC);

CREATE INDEX page_ai_styles_batch_id_idx
  ON page_ai_styles (batch_id);

CREATE UNIQUE INDEX page_ai_styles_one_active_per_page_idx
  ON page_ai_styles (page_id)
  WHERE is_active = true;
