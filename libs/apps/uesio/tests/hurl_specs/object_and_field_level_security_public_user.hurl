######################################################
# Tests object and field level security enforcement 
# on wire loads, for a public user
######################################################

# Object level security -- we should NOT be able to query wire_condition
# because the public profile has no access to it
POST https://tests.{{domain}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name": "noAccess",
            "fields": [
                {"id":"uesio/core.uniquekey"},
                {"id":"uesio/tests.name"}
            ],
            "query": true
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Profile uesio/tests.public does not have read access to the uesio/tests.wire_condition collection."

# Object level security -- we SHOULD be able to query the animal collection
# because the public profile DOES have access to it
POST https://tests.{{domain}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "name": "hasAccess",
            "fields": [
                {"id":"uesio/core.uniquekey"},
                {"id":"uesio/tests.genus"},
                {"id":"uesio/tests.species"}
            ],
            "batchsize": 1,
            "query": true,
            "conditions": [
                { "field": "uesio/tests.genus", "operator": "EQ", "value": "Mouton" }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" count == 1
jsonpath "$.wires[0].data[*]['uesio/tests.species']" nth 0 == "Abrahan"

# Object security in routes - we SHOULD be able to query the animal collection via a route load
# for a route with a wire on our requested collection
GET https://tests.{{domain}}:{{port}}/site/routes/path/uesio/tests/publicanimalslist
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.dependencies.wire.entities[*].data[*]['uesio/tests.species']" nth 0 == "Abrahan"
jsonpath "$.dependencies.wire.entities[*].data[*]['uesio/tests.genus']" nth 0 == "Mouton"
jsonpath "$.dependencies.wire.entities[*]['debugQueryString']" nth 0 == ```
SELECT
main.fields->>'uesio/tests.genus' AS "uesio/tests.genus",
main.fields->>'uesio/tests.species' AS "uesio/tests.species",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.genus' = $3
LIMIT 3```