-- Get a count of any usage data at all for a given month and user,
-- excluding known Uesio/TCM people
select count(d1.id) as cnt, 
    to_char(d1.createdat, 'YYYY-MM') as "month", 
    d1.fields->>'uesio/studio.user' as "userId",
    d2.fields->>'uesio/core.username' as "userName",
    d2.fields->>'uesio/core.email' as "userEmail"
from data as d1
inner join data as d2 on (d1.fields->>'uesio/studio.user')::uuid = d2.id
where d2.collection = 'uesio/core.user'
and d1.collection = 'uesio/studio.usage'
and date(d1.createdat) > '2023-06-01'
and d2.fields->>'uesio/core.username'
        not in (
            'guest',
            'system',
            'ben',
            'zach',
            'abel',
            'gregg',
            'wessel',
            'marko',
            'uesio',
            'baxter',
            'albin',
            'osman',
            'vic',
            'abeltest',
            'greggsales',
            'jerry',
            'matti',
            'ggrassi2',
            'arnal',
            'sibylle',
            'sascha',
            'james',
            'uesioautomation',
            'demo',
            'greggcrm',
            'thebax',
            'michael',
            'albinsales',
            'victoria',
            'vicwoods',
            'vicwoo',
            'vicgoo',
            'greggtest1234',
            'alexkane',
            'abeljimo',
            'greggtestingses',
            'greggchecking',
            'vawtest',
            'matthi',
            'matt',
            'alex',
            'james1'

)
group by to_char(d1.createdat, 'YYYY-MM'),
    d1.fields->>'uesio/studio.user',
    d2.fields->>'uesio/core.username',
    d2.fields->>'uesio/core.email'
order by to_char(d1.createdat, 'YYYY-MM'), 
    d1.fields->>'uesio/studio.user'