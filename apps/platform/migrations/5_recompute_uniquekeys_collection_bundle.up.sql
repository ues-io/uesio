
begin;

UPDATE public.data 
SET fields = jsonb_set(fields,'{uesio/studio.repository}', '"ues.io"') 
WHERE collection = 'uesio/studio.bundle'

UPDATE public.data SET 
uniquekey = split_part(uniquekey, ':', 1) || ':' ||  
split_part(uniquekey, ':', 2) || ':' || 
split_part(uniquekey, ':', 3) || ':' || 
split_part(uniquekey, ':', 4) || ':ues.io'
WHERE collection = 'uesio/studio.bundle'

commit;
