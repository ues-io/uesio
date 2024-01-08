
begin;

UPDATE public.data SET 
uniquekey = split_part(uniquekey, ':', 1) || ':' ||  
jsonb_extract_path_text(fields, 'uesio/studio.repository')  || ':' || 
split_part(uniquekey, ':', 2) || ':' || 
split_part(uniquekey, ':', 3) || ':' || 
split_part(uniquekey, ':', 4) 

commit;
