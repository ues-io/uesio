
begin;

-------------------------
-- TABLE: data
-------------------------
-- Migrate to newer DB format
-- 1. id, createdby, updatedby, createdat, updatedat fields hoisted to top-level
-- 2. primary key is now combo of top level fields
-- 3. createdat/updatedat fields are now timestamps stored with millisecond precision, not second

alter table public.data add column id_temp uuid;
alter table public.data add column "owner" uuid;
alter table public.data add column createdby uuid;
alter table public.data add column updatedby uuid;
alter table public.data add column createdat timestamptz(0);
alter table public.data add column updatedat timestamptz(0);

-- drop other indexes/constraints
alter table public.data drop constraint data_uniquekey_key;
alter table public.data drop constraint data_pkey;
drop index if exists unique_idx;
drop index if exists collection_idx;
drop index if exists tenant_idx;
drop index if exists autonumber_idx;

-- host nested fields into their top-level components
update public.data set
    id_temp = (fields->>'uesio/core.id')::uuid,
    "owner" = (fields->>'uesio/core.owner')::uuid,
    uniquekey = (fields->>'uesio/core.uniquekey')::text,
    "collection" = split_part("collection",'>', 2),
    createdby = (fields->>'uesio/core.createdby')::uuid,
    updatedby = (fields->>'uesio/core.updatedby')::uuid,
    createdat = (to_timestamp((fields->>'uesio/core.createdat')::bigint / 1000))::timestamptz(0),
    updatedat = (to_timestamp((fields->>'uesio/core.updatedat')::bigint / 1000))::timestamptz(0);

--rename id column
alter table public.data drop column id;
alter table public.data rename column id_temp to id;

--redo the primary key
alter table public.data
    add constraint data_pkey primary key (tenant, collection, id);

-- clean up nested fields
update public.data
    set fields = fields
        #- '{uesio/core.id}'
        #- '{uesio/core.owner}'
        #- '{uesio/core.uniquekey}'
        #- '{uesio/core.createdby}'
        #- '{uesio/core.updatedby}'
        #- '{uesio/core.createdat}'
        #- '{uesio/core.updatedat}';

CREATE TEMPORARY TABLE sys_users ON COMMIT DROP
    AS select tenant, id as sys_user_id from public.data
    WHERE fields->>'uesio/core.username' = 'system';

-- before adding not null constraints, we need to ensure that all fields are populated
UPDATE public.data d
    SET "owner" = su.sys_user_id,
        createdby = su.sys_user_id,
        updatedby = su.sys_user_id
    FROM sys_users su
    WHERE d.tenant = su.tenant
    AND "owner" is null OR createdby is null or updatedby is null;

-- add not null constraints
alter table public.data alter column id set not null;
alter table public.data alter column owner set not null;
alter table public.data alter column createdby set not null;
alter table public.data alter column updatedby set not null;
alter table public.data alter column createdat set not null;
alter table public.data alter column updatedat set not null;
alter table public.data alter column fields set not null;

-- create new indexes
create unique index unique_idx on public.data (tenant,collection,uniquekey);
create unique index autonumber_idx on public.data (tenant,collection,autonumber);

-------------------------
-- TABLE: tokens
-------------------------
-- 1. Migrate recordid to uuid
-- 2. Remove unnecesarry fullid column (handled by unique constraint now)
-- 3. remove tenant identifier from collection

-- drop indexes on tokens
drop index if exists fullid_idx;
drop index if exists recordid_idx;

-- drop unneeded fullid column
alter table public.tokens drop column fullid;

-- migrate recordid to a uuid
alter table public.tokens add column recordid_temp uuid;
update public.tokens set recordid_temp = recordid::uuid;
alter table public.tokens drop column recordid;
alter table public.tokens rename column recordid_temp to recordid;

-- remove tenant identifier from collection
update public.tokens set "collection" = split_part("collection",'>', 2);

-- add constraints
alter table public.tokens
    add constraint tokens_pkey primary key (tenant, collection, recordid, token);
create index tokens_idx on public.tokens (tenant,collection,recordid);

commit;
