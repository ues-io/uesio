######################################################
# Tests for field type AUTONUMBER
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
ORDER BY main.id asc
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
jsonpath "$.wires[0].data[0]['uesio/tests.autonumber']" == "ID-001"

# Operator: EQ | valueSource: PARAM
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.autonumber"}],
            "query":true,
            "params": {
                "id": "ID-001"
            },
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
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
jsonpath "$.wires[0].data[0]['uesio/tests.autonumber']" == "ID-001"

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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "ID-001"

# Operator: NOT_EQ | valueSource: PARAM
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.autonumber"}],
            "query":true,
            "params": {
                "id": "ID-001"
            },
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
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
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" not contains "ID-001"

# Operator: IN | valueSource: VALUE
# entry 7
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
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" contains "ID-002"

# Operator: IN | valueSource: LOOKUP
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [
                {
                    "id":"uesio/core.uniquekey"
                }
            ],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.autonumber"}],
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
jsonpath "$.wires[1].data[0]['uesio/tests.autonumber']" == "ID-001"
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "ID-001"


# Operator: IN | valueSource: PARAM
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.autonumber"}],
            "query":true,
            "params": {
                "param1": "ID-001",
                "param2": "ID-002"
            },
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
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
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" contains "ID-002"

# Operator: NOT_IN | valueSource: VALUE
# entry 10
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
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" not contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" not contains "ID-002"

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
                    "id":"uesio/tests.autonumber"
                }
            ],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "name":"condition",
            "fields": [
                {
                    "id":"uesio/tests.autonumber"
                }
            ],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.autonumber"
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
            "fields": [{"id": "uesio/tests.autonumber"}],
            "query":true,
            "params": {
                "param1": "ID-001",
                "param2": "ID-002",
                "param3": "ID-003"
            },
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
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
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" not contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" not contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" not contains "ID-003"

# Operator: IS_BLANK | valueSource: VALUE
# entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields": [
                {
                    "id":"uesio/tests.autonumber"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data['uesio/tests.autonumber']" not exists

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 14
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
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" exists
