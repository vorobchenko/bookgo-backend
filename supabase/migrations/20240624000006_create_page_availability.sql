CREATE TABLE page_availability (
  page_id                 UUID PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,

  timezone                VARCHAR(64) NOT NULL DEFAULT 'UTC',
  buffer_before_minutes   INTEGER NOT NULL DEFAULT 0,
  buffer_after_minutes    INTEGER NOT NULL DEFAULT 0,
  min_notice_hours        INTEGER NOT NULL DEFAULT 0,
  max_days_ahead          INTEGER NOT NULL DEFAULT 60,
  days                    JSONB NOT NULL DEFAULT '[]',

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
