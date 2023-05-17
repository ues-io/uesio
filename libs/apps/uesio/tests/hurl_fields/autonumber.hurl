######################################################
# Tests for field type AUTONUMBER
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}
HTTP 200

# Test a wire load with no conditions on wire with collection wire_condition
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json

{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query": true,
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

# Test a wire load with no conditions on wire with collection wire_reference
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json

{
    "wires": [
        {
            "collection":"uesio/tests.wire_reference",
            "query": true,
            "batchsize":2
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
main.tenant = $2
ORDER BY main.id::text asc
LIMIT 3```
jsonpath "$.wires[0].data[*]" count == 2


# Operator: EQ | valueSource: VALUE
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.autonumber"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "ID-001"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
main.fields->>'uesio/tests.autonumber' AS "uesio/tests.autonumber",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.autonumber' = $3
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" == "ID-001"


# Operator: NOT_EQ | valueSource: VALUE
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.autonumber",
                    "operator": "NOT_EQ",
                    "value": "ID-001",
                    "valueSource": "VALUE"
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
main.fields->>'uesio/tests.autonumber' is distinct from $3
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 8
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-001"


# Operator: IN | valueSource: VALUE
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.autonumber"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "IN",
                    "values": [
                        "ID-001",
                        "ID-002"
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
main.fields->>'uesio/tests.autonumber' AS "uesio/tests.autonumber",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.autonumber' IN ($3,$4)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 2
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-002"

# Operator: IN | valueSource: LOOKUP
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_reference",
            "name":"reference",
            "fields": [
                {
                    "id":"uesio/tests.autonumber_reference"
                }
            ],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.autonumber"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.autonumber_reference"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].debugQueryString" == ```
SELECT
main.fields->>'uesio/tests.autonumber' AS "uesio/tests.autonumber",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.autonumber' IN ($3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[1].data[*]['uesio/tests.autonumber']" includes "ID-001"
jsonpath "$.wires[1].data[*]['uesio/tests.autonumber']" includes "ID-002"
jsonpath "$.wires[1].data[*]['uesio/tests.autonumber']" includes "ID-003"
jsonpath "$.wires[1].data[*]['uesio/tests.autonumber']" includes "ID-004"
jsonpath "$.wires[1].data[*]['uesio/tests.autonumber']" includes "ID-005"
jsonpath "$.wires[1].data[*]['uesio/tests.autonumber']" includes "ID-006"
jsonpath "$.wires[1].data[*]['uesio/tests.autonumber']" includes "ID-007"
jsonpath "$.wires[1].data[*]['uesio/tests.autonumber']" includes "ID-008"
jsonpath "$.wires[1].data[*]['uesio/tests.autonumber']" includes "ID-009"
jsonpath "$.wires[1].data[*]['uesio/core.uniquekey']" count == 9

# Operator: NOT_IN | valueSource: VALUE
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.autonumber"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "NOT_IN",
                    "values": [
                        "ID-001",
                        "ID-002"
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
main.fields->>'uesio/tests.autonumber' AS "uesio/tests.autonumber",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.autonumber' NOT IN ($3,$4)
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 7
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-003"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-004"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-005"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-006"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-007"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-008"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-009"

# Operator: NOT_IN | valueSource: LOOKUP
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_reference",
            "name":"reference",
            "fields": [
                {
                    "id":"uesio/tests.autonumber_reference"
                }
            ],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.autonumber_reference"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
#jsonpath "$.wires[1].debugQueryString" == ```
#SELECT
#main.id::text AS "uesio/core.id",
#main.uniquekey AS "uesio/core.uniquekey"
#FROM data as "main"
#WHERE
#main.collection = $1 AND
#main.tenant = $2 AND
#main.fields->>'uesio/tests.autonumber' NOT IN ($3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
#ORDER BY main.id::text asc
#LIMIT 501```
#jsonpath "$.wires[1].data[*]" not exists


# Operator: IS_BLANK | valueSource: VALUE
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.autonumber",
                    "operator": "IS_BLANK"
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
main.fields->>'uesio/tests.autonumber' IS NULL
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]" not exists


# Operator: IS_NOT_BLANK | valueSource: VALUE
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.autonumber"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.autonumber",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
main.fields->>'uesio/tests.autonumber' AS "uesio/tests.autonumber",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.autonumber' IS NOT NULL
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 9
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-009"