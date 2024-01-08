
begin;

UPDATE public.data 
SET fields = jsonb_set(fields,'{uesio/studio.repository}', '"ues.io"') 
WHERE collection = 'uesio/studio.bundle'

commit;
