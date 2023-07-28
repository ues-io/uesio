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
        },
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
HTTP 400
[Asserts]
body contains "Load Failed: Profile uesio/studio.public does not have read access to the uesio/tests.wire_condition collection."

# Object level security -- we SHOULD be able to query wire_conditionanimal
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
jsonpath "$.wires[0].data['uesio/tests.species']" nth 0 == "Abrahan"