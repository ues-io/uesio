######################################################
# Tests loading a wire with localized field names
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test a wire load with a simple condition
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "fields": [
                {
                    "id": "genus"
                },
                {
                    "id": "species"
                }
            ],
            "conditions": [
                {
                    "field": "species",
                    "value": "Jerrine"
                }
            ],
            "order": [
                {
                     "field": "genus",
                     "desc": false
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey,
'uesio/tests.genus',main.fields->'uesio/tests.genus',
'uesio/tests.species',main.fields->'uesio/tests.species'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.species' = $3
ORDER BY main.fields->>'uesio/tests.genus' asc
LIMIT 501```
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "MacAughtrie:Jerrine"
jsonpath "$.wires[0].data[0]['uesio/tests.genus']" == "MacAughtrie"
jsonpath "$.wires[0].data[0]['uesio/tests.species']" == "Jerrine"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "McCreary:Jerrine"
jsonpath "$.wires[0].data[1]['uesio/tests.genus']" == "McCreary"
jsonpath "$.wires[0].data[1]['uesio/tests.species']" == "Jerrine"

