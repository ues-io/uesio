-- No op. Not going back :)

begin;

alter table public.data drop column createdby; 

commit;