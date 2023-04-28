######################################################
# Tests loading a wire
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}


# Test a wire load with no conditions
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "batchsize":2
        }
    ]
}
HTTP 200
[Asserts]
# If this test is failing for you, make sure you have `UESIO_DEBUG_SQL=true` set locally
# and then re-run the app
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2
ORDER BY main.id::text asc
LIMIT 3```
jsonpath "$.wires[0].data[*]" count == 2

# Test a wire load with a simple condition
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.species",
                    "value": "Jerrine"
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
main.fields->>'uesio/tests.species' = $3
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 2
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "MacAughtrie:Jerrine"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "McCreary:Jerrine"

# Test a wire load with a condition on the unique key field
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "fields": [
                {
                    "id": "uesio/tests.genus"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "MacAughtrie:Jerrine"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
main.fields->>'uesio/tests.genus' AS "uesio/tests.genus",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.uniquekey = $3
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "MacAughtrie:Jerrine"
[Captures]
idvalue: jsonpath "$.wires[0].data[*]['uesio/core.id']"

# Test a wire load with a condition on the core id field
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "fields": [
                {
                    "id": "uesio/tests.genus"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.id",
                    "value": "{{idvalue}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
main.fields->>'uesio/tests.genus' AS "uesio/tests.genus",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.id::text = $3
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "MacAughtrie:Jerrine"




