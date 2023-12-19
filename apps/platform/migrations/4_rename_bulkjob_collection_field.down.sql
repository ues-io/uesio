
begin;

UPDATE public.data
SET fields = jsonb_set(fields #- '{uesio/core.collectionid}',
    '{uesio/core.collection}',
    fields#>'{uesio/core.collectionid}')
WHERE collection = 'uesio/core.bulkjob'
AND fields ? 'uesio/core.collectionid';

commit;
