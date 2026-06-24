CREATE TABLE page_themes (
  page_id       UUID PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,

  preset        VARCHAR(20) NOT NULL DEFAULT 'bold'
                CHECK (preset IN ('neon', 'pastel', 'bold')),
  accent_color  VARCHAR(7) NOT NULL DEFAULT '#c6f432',
  mode          VARCHAR(10) NOT NULL DEFAULT 'auto'
                CHECK (mode IN ('light', 'dark', 'auto')),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
