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
jsonpath "$.wires[0].data" count == 2
jsonpath "$.collections" not exists

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
            ],
            "order": [
                {
                     "field": "uesio/core.uniquekey",
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
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.species' = $3
ORDER BY main.uniquekey asc
LIMIT 501```
jsonpath "$.wires[0].conditions[0].id" == "mycoolid"
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "MacAughtrie:Jerrine"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "McCreary:Jerrine"
jsonpath "$.wires[0].order" not exists # Order should not be sent back to us

# Test a wire load with a param merge condition
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
                    "value": "$Param{myparam}"
                }
            ],
            "params": {
                "myparam": "Jerrine"
            }
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
jsonpath "$.wires[0].conditions[0].value" == "$Param{myparam}"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 2
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "MacAughtrie:Jerrine"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "McCreary:Jerrine"
jsonpath "$.wires[0].params" not exists # params should not be sent back to us

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
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "MacAughtrie:Jerrine"
jsonpath "$.wires[0].fields" not exists # Fields should not be sent back to us
[Captures]
idvalue: jsonpath "$.wires[0].data[0]['uesio/core.id']"

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
    ],
    "includeMetadata": true
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
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "MacAughtrie:Jerrine"
jsonpath "$.collections[*]" count == 1
jsonpath "$.collections['uesio/tests.animal'].fields[*]" count == 4
jsonpath "$.collections['uesio/tests.animal'].fields['uesio/core.id']['name']" == "id"
jsonpath "$.collections['uesio/tests.animal'].fields['uesio/core.uniquekey']['name']" == "uniquekey"
jsonpath "$.collections['uesio/tests.animal'].fields['uesio/tests.genus']['name']" == "genus"
jsonpath "$.collections['uesio/tests.animal'].fields['uesio/tests.species']['name']" == "species"

# Verify that wire properties from a view are processed correctly
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/simple_wire_load
HTTP 200
[Asserts]
jsonpath "$.dependencies.wire" count == 1
jsonpath "$.dependencies.wire[0].name" == "animals"
jsonpath "$.dependencies.wire[0].view" == "uesio/tests.simple_wire_load($root)"
jsonpath "$.dependencies.wire[0].batchsize" == 10
jsonpath "$.dependencies.wire[0].query" == true
jsonpath "$.dependencies.wire[0].batchnumber" == 1
jsonpath "$.dependencies.wire[0].more" == true
jsonpath "$.dependencies.wire[0].preloaded" == true
jsonpath "$.dependencies.wire[0].loadAll" == false
jsonpath "$.dependencies.wire[0].data[*]['uesio/core.id']" count == 10

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
            ],
            "order": [
                {
                    "field": "uesio/tests.genus"
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
main.fields->>'uesio/tests.species' = ANY ($3)
ORDER BY main.fields->>'uesio/tests.genus' asc
LIMIT 501```
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "MacAughtrie:Jerrine"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "McCreary:Jerrine"

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
main.fields->>'uesio/tests.genus' <> ALL ($3) AND
main.fields->>'uesio/tests.species' = ANY ($4)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "Soitoux:Franklin"

# Wire load with ORDER fields not otherwise requested in Field / Condition metadata
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/tests.animal",
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.species",
                    "operator": "IN",
                    "values": [
                        "Franklin",
                        "Benjamin"
                    ]
                }
            ],
            "order": [
                {
                    "field": "uesio/tests.total_population",
                    "desc": true
                }
            ]
        }
    ],
    "includeMetadata": true
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.species' = ANY ($3)
ORDER BY main.fields->'uesio/tests.total_population' desc
LIMIT 501```
# Lathe:Franklin has a higher total population so it should come first
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "Lathe:Franklin"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "Soitoux:Franklin"
# Verify that metadata for the order fields was loaded and is available in the wire
jsonpath "$.collections['uesio/tests.animal'].fields['uesio/tests.total_population'].type" == "NUMBER"
