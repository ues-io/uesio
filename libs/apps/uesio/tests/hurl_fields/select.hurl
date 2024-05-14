######################################################
# Tests for field type SELECT
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Test a wire load with no conditions on wire with collection wire_condition
# entry 2
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
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2
ORDER BY main.id::text asc
LIMIT 3```
jsonpath "$.wires[0].data" count == 2

# Operator: EQ | valueSource: VALUE
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.select"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "one"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.select']" == "one"

# Operator: EQ | valueSource: PARAM
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.select"}],
            "query":true,
            "params": {
                "id": "one"
            },
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "id"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.select']" == "one"

# Operator: NOT_EQ | valueSource: VALUE
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "NOT_EQ",
                    "value": "one",
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "one"

# Operator: NOT_EQ | valueSource: PARAM
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.select"}],
            "query":true,
            "params": {
                "id": "one"
            },
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "NOT_EQ",
                    "valueSource": "PARAM",
                    "param": "id"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.select']" not includes "one"

# Operator: IN | valueSource: VALUE
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.select"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "IN",
                    "values": [
                        "one",
                        "two"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.select']" includes "one"
jsonpath "$.wires[0].data[*]['uesio/tests.select']" includes "two"

# Operator: IN | valueSource: LOOKUP
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/tests.select"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.select"}],
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
jsonpath "$.wires[1].data[0]['uesio/tests.select']" == "one"
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "ID-001"


# Operator: IN | valueSource: PARAM
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.select"}],
            "query":true,
            "params": {
                "param1": "one",
                "param2": "two"
            },
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "IN",
                    "valueSource": "PARAM",
                    "params": [
                        "param1",
                        "param2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.select']" includes "one"
jsonpath "$.wires[0].data[*]['uesio/tests.select']" includes "two"

# Operator: NOT_IN | valueSource: VALUE
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.select"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "NOT_IN",
                    "values": [
                        "one",
                        "two"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 8
jsonpath "$.wires[0].data[*]['uesio/tests.select']" not includes "one"
jsonpath "$.wires[0].data[*]['uesio/tests.select']" not includes "two"

# Operator: NOT_IN | valueSource: LOOKUP
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [
                {
                    "id":"uesio/tests.select"
                }
            ],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "name":"condition",
            "fields": [
                {
                    "id":"uesio/tests.select"
                }
            ],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.select"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]" isEmpty

# Operator: NOT_IN | valueSource: PARAM
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.select"}],
            "query":true,
            "params": {
                "param1": "one",
                "param2": "two",
                "param3": "three"
            },
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "NOT_IN",
                    "valueSource": "PARAM",
                    "params": [
                        "param1",
                        "param2",
                        "param3"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.select']" not includes "one"
jsonpath "$.wires[0].data[*]['uesio/tests.select']" not includes "two"
jsonpath "$.wires[0].data[*]['uesio/tests.select']" not includes "three"

# Operator: IS_BLANK | valueSource: VALUE
# entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.select"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.select']" includes ""
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-009"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-010"

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 14
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.select"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.select",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.select']" not includes ""
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-009"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-010"
