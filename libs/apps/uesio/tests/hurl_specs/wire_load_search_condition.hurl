######################################################
# Tests loading a wire with search conditions
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test a wire load with a search condition
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "conditions": [
                {
                    "type": "SEARCH",
                    "fields": [
                        "uesio/tests.select"
                    ],
                    "value": "four"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
((main.fields->>'uesio/tests.name')::text ILIKE $3 OR
(main.fields->>'uesio/tests.select')::text ILIKE $3)
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 1
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-004"
