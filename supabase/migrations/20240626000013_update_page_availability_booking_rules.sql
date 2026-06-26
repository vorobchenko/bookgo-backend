-- Drop unused buffer_before_minutes; add slot interval and daily booking cap.

ALTER TABLE page_availability
  DROP COLUMN IF EXISTS buffer_before_minutes;

ALTER TABLE page_availability
  ADD COLUMN IF NOT EXISTS slot_interval_minutes INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS max_bookings_per_day INTEGER NOT NULL DEFAULT 0;

ALTER TABLE page_availability
  DROP CONSTRAINT IF EXISTS page_availability_slot_interval_positive;

ALTER TABLE page_availability
  ADD CONSTRAINT page_availability_slot_interval_positive
  CHECK (slot_interval_minutes > 0);

ALTER TABLE page_availability
  DROP CONSTRAINT IF EXISTS page_availability_max_bookings_non_negative;

ALTER TABLE page_availability
  ADD CONSTRAINT page_availability_max_bookings_non_negative
  CHECK (max_bookings_per_day >= 0);
