BEGIN;

    DO $$DECLARE r record;
    BEGIN
        RAISE WARNING 'There is no reliable way via sql script to come back from dropping the autonumber field since each record itself needs to be parsed based on the metadata configuration for the AUTONUMBER field at the time the record was created (e.g., prefix, leading zeros, etc.).  If this is ever needed, a manual approach will be required.';

        -- Note that the original autonumber field did not allow NULLs but since we cannot seed the data properly, we allow NULLs instead (see comment above)
        ALTER TABLE IF EXISTS public.data
            ADD COLUMN autonumber integer NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS autonumber_idx
            ON public.data USING btree
            (tenant COLLATE pg_catalog."default" ASC NULLS LAST, collection COLLATE pg_catalog."default" ASC NULLS LAST, autonumber ASC NULLS LAST)
            TABLESPACE pg_default;
    END$$;	

COMMIT;