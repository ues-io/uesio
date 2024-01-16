
begin;

UPDATE public.data 
SET fields = jsonb_set(fields,'{uesio/studio.repository}', '"ues.io"'), uniquekey = concat(uniquekey, ':ues.io')
WHERE collection = 'uesio/studio.bundle'

commit;
