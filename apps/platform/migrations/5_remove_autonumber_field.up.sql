BEGIN;

DROP INDEX IF EXISTS public.autonumber_idx;

ALTER TABLE IF EXISTS public.data DROP COLUMN IF EXISTS autonumber;

COMMIT;
