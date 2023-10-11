######################################################
# Tests loading a wire with subquery conditions
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test a wire load with a single subquery condition
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields":[
                {
                    "id": "uesio/tests.text"
                },
                {
                    "id": "uesio/core.uniquekey"
                }
            ],
            "conditions": [
                {
                    "type": "SUBQUERY",
                    "field": "uesio/tests.user",
                    "operator": "IN",
                    "subcollection": "uesio/core.user",
                    "subfield": "uesio/core.id",
                    "conditions": [
                        {
                            "field": "uesio/core.username",
                            "operator": "IN",
                            "values": [
                                "uesio"
                            ]
                        }
                    ]
                },
                {
                    "field": "uesio/tests.text",
                    "operator": "NOT_EQ",
                    "value": null
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
main.fields->>'uesio/tests.text' AS "uesio/tests.text",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.user' IN (SELECT subquery.id::text FROM data as "subquery" WHERE (subquery.collection = $3 AND
subquery.tenant = $4 AND
subquery.fields->>'uesio/core.username' = ANY ($5))) AND
main.fields->>'uesio/tests.text' is distinct from $6
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[0]['uesio/tests.text']" == "text 2"
