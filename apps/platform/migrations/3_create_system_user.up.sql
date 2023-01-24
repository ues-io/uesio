
------------------------------------
-- create the system user, if needed
-- if it's already there, do nothing
------------------------------------
BEGIN;

-- use a hardcoded uuid for system user because
-- (a) it doesn't matter if we use a static uuid
-- (b) it's simpler than trying to store a variable
INSERT INTO public.data (
    id,uniquekey,"owner",createdby,updatedby,createdat,updatedat,collection,tenant,autonumber,fields
) VALUES ('5e1a6968-2d19-4832-9ea7-2948c3537231',
    'system',
    '5e1a6968-2d19-4832-9ea7-2948c3537231',
    '5e1a6968-2d19-4832-9ea7-2948c3537231',
    '5e1a6968-2d19-4832-9ea7-2948c3537231',
    current_timestamp,
    current_timestamp,
    'uesio/core.user',
    'site:uesio/studio:prod',
    0,
    '{"uesio/core.type":"PERSON", "uesio/core.profile": "uesio/studio.standard", "uesio/core.firstname": "Super", "uesio/core.lastname":  "Admin", "uesio/core.username":  "system"}'::jsonb
) ON CONFLICT (tenant, collection, uniquekey) DO NOTHING;

COMMIT;
