######################################################
# Tests loading a wire with lookup conditions
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}


# IN Operator with values
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "ID-001"
                }
            ]
        },
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.text"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/core.uniquekey"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].debugQueryString" == ```
SELECT
main.fields->>'uesio/tests.text' AS "uesio/tests.text",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.uniquekey = ANY ($3)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[1].data[0]['uesio/tests.text']" == "text 1"
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "ID-001"

# NOT_IN Operator with values
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/tests.text"}],
            "conditions": [
                {
                    "field": "uesio/tests.text",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "text 1"
                }
            ],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "name":"condition",
            "fields": [{"id":"uesio/tests.text"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.text",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.text"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].debugQueryString" == ```
SELECT
main.fields->>'uesio/tests.text' AS "uesio/tests.text",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.text' <> ALL ($3)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[1].data[*]['uesio/tests.text']" not includes "text 1"

# IN Operator without values
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "bad non existant value"
                }
            ]
        },
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.text"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/core.uniquekey"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].debugQueryString" == ```
SELECT
main.fields->>'uesio/tests.text' AS "uesio/tests.text",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.uniquekey = ANY ($3)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[1].data" isEmpty

# NOT_IN Operator without values
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/tests.text"}],
            "conditions": [
                {
                    "field": "uesio/tests.text",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "bad nonexistent value"
                }
            ],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "name":"condition",
            "fields": [{"id":"uesio/tests.text"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.text",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.text"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].debugQueryString" == ```
SELECT
main.fields->>'uesio/tests.text' AS "uesio/tests.text",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.text' <> ALL ($3)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[1].data[*]['uesio/tests.text']" includes "text 1"
