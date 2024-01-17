
begin;

UPDATE public.data
SET fields = jsonb_delete(fields, 'uesio/studio.repository'), uniquekey = substring(uniquekey, 1, length(uniquekey) - position(':' in reverse(uniquekey)))
WHERE collection = 'uesio/studio.bundle';

commit;
