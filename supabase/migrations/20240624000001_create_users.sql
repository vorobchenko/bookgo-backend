CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  name          VARCHAR(100),
  phone         VARCHAR(50),
  avatar        VARCHAR(500),
  bio           TEXT,
  city          VARCHAR(255),
  timezone      VARCHAR(64) DEFAULT 'UTC',
  lang          VARCHAR(5) NOT NULL DEFAULT 'en'
                CHECK (lang IN ('en', 'ru')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX users_email_idx ON users (email);
