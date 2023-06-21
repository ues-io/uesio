######################################################
# Tests loading a wire
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Test a wire load with a group condition (or)
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "conditions": [
                {
                    "type": "GROUP",
                    "conjunction": "OR",
                    "conditions": [
                        {
                            "field": "uesio/tests.species",
                            "value": "Jerrine"
                        },
                        {
                            "field": "uesio/tests.species",
                            "value": "Jerrie"
                        }
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
(main.fields->>'uesio/tests.species' = $3 OR
main.fields->>'uesio/tests.species' = $4)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 3
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "MacAughtrie:Jerrine"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "McCreary:Jerrine"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "Pringour:Jerrie"

