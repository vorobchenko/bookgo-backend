CREATE TABLE page_blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id    UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type       VARCHAR(32) NOT NULL
             CHECK (type IN (
               'stories', 'gallery', 'video', 'location', 'contacts',
               'reviews', 'faq', 'cancellationPolicy', 'customQuestions'
             )),
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, type)
);

CREATE INDEX page_blocks_page_id_idx ON page_blocks (page_id);
