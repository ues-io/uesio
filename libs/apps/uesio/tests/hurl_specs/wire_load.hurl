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
                    "id": "mycoolid",
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
jsonpath "$.wires[0].conditions[0].id" == "mycoolid"
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

# Verify that wire properties from a view are processed correctly
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/simple_wire_load
HTTP 200
[Asserts]
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].name" == "animals"
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].view" == "uesio/tests.simple_wire_load($root)"
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].batchsize" == 10
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].query" == true
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].batchnumber" == 1
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].more" == true
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].preloaded" == true
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].loadAll" == false
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].data[*]['uesio/core.id']" count == 10

# Wire load with IN condition and values
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
                    "operator": "IN",
                    "values": [
                        "Jerrine"
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
main.fields->>'uesio/tests.species' IN ($3)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 2
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "MacAughtrie:Jerrine"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "McCreary:Jerrine"

# Wire load with NOT IN condition and values
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.genus",
                    "operator": "NOT_IN",
                    "values": [
                        "Plaster",
                        "Lathe"
                    ]
                },
                {
                    "field": "uesio/tests.species",
                    "operator": "IN",
                    "values": [
                        "Franklin",
                        "Benjamin"
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
main.fields->>'uesio/tests.genus' NOT IN ($3,$4) AND
main.fields->>'uesio/tests.species' IN ($5,$6)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "Soitoux:Franklin"