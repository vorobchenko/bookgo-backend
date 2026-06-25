-- Backfill pages created before starter service + schedule were seeded on create.

UPDATE page_availability
SET
  days = '[
    {"weekday":1,"working":true,"bookable":true,"ranges":[{"id":"rng-1","start":"09:00","end":"17:00"}]},
    {"weekday":2,"working":true,"bookable":true,"ranges":[{"id":"rng-2","start":"09:00","end":"17:00"}]},
    {"weekday":3,"working":true,"bookable":true,"ranges":[{"id":"rng-3","start":"09:00","end":"17:00"}]},
    {"weekday":4,"working":true,"bookable":true,"ranges":[{"id":"rng-4","start":"09:00","end":"17:00"}]},
    {"weekday":5,"working":true,"bookable":true,"ranges":[{"id":"rng-5","start":"09:00","end":"17:00"}]}
  ]'::jsonb,
  updated_at = now()
WHERE days = '[]'::jsonb;

INSERT INTO page_service_items (
  page_id,
  title,
  subtitle,
  duration_minutes,
  price_amount,
  currency,
  price_hidden,
  photo_url,
  is_active,
  sort_order
)
SELECT
  p.id,
  'Session',
  '',
  60,
  0,
  'PLN',
  false,
  '',
  true,
  0
FROM pages p
WHERE NOT EXISTS (
  SELECT 1 FROM page_service_items si WHERE si.page_id = p.id
);
