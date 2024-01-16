
begin;

UPDATE public.data
SET fields = jsonb_delete(fields, 'uesio/studio.repository'), uniquekey = replace(uniquekey, ':ues.io', '')
WHERE collection = 'uesio/studio.bundle'

commit;
