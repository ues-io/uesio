-- delete the system user
delete from public.data
where uniquekey='system'
and collection='uesio/core.user'
and tenant='site:uesio/studio:prod'
