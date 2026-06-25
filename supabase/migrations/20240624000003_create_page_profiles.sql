CREATE TABLE page_profiles (
  page_id     UUID PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,

  name        VARCHAR(200) NOT NULL DEFAULT '',
  role        VARCHAR(200) NOT NULL DEFAULT '',
  bio         TEXT NOT NULL DEFAULT '',
  city        VARCHAR(120) NOT NULL DEFAULT '',
  timezone    VARCHAR(64) NOT NULL DEFAULT 'UTC',
  avatar_url  VARCHAR(500) NOT NULL DEFAULT '',
  email       VARCHAR(255) NOT NULL DEFAULT '',
  phone       VARCHAR(50) NOT NULL DEFAULT '',

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
