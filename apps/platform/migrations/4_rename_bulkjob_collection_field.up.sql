
begin;

UPDATE public.data
SET fields = jsonb_set(fields #- '{uesio/core.collection}',
    '{uesio/core.collectionid}',
    fields#>'{uesio/core.collection}')
WHERE collection = 'uesio/core.bulkjob'
AND fields ? 'uesio/core.collection';

commit;
