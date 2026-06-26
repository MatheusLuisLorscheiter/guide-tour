-- ============================================================
-- Migration 011: Events geolocation support
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_latitude_range'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_latitude_range
      CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_longitude_range'
      AND conrelid = 'public.events'::regclass
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_longitude_range
      CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_tenant_event_date
  ON public.events (tenant_id, event_date);

CREATE INDEX IF NOT EXISTS idx_events_tenant_coordinates
  ON public.events (tenant_id, latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
