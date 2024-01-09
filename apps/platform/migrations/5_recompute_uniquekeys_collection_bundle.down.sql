
begin;

UPDATE public.data
SET fields = jsonb_delete(fields, 'uesio/studio.repository')
WHERE collection = 'uesio/studio.bundle';

UPDATE public.data SET 
uniquekey = split_part(uniquekey, ':', 1) || ':' ||  
split_part(uniquekey, ':', 2) || ':' || 
split_part(uniquekey, ':', 3) || ':' || 
split_part(uniquekey, ':', 4)
WHERE collection = 'uesio/studio.bundle'

commit;
