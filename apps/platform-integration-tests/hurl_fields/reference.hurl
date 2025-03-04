######################################################
# Tests for field type REFERENCE
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# WIRE LOAD to get uuid from uniquekey ID-001
# entry 2
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
        }
    ]
}
HTTP 200
[Captures]
ID001-UUID: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# WIRE LOAD to get uuid from uniquekey ID-002
# entry 3
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
                    "value": "ID-002"
                }
            ]
        }
    ]
}
HTTP 200
[Captures]
ID002-UUID: jsonpath "$.wires[0].data[0]['uesio/core.id']"


# Operator: EQ | valueSource: VALUE | Bad Value
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.reference",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": 123
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].errors[0].message" == "failed to encode args[2]: unable to encode 123 into text format for text (OID 25): cannot find encode plan"

# Operator: EQ | valueSource: VALUE | Self reference (ID-001 --> ID-001)
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.reference",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "{{ID001-UUID}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.reference']['uesio/core.uniquekey']" == "ID-001"

# Operator: EQ | valueSource: VALUE | Reference to another record (ID-004 --> ID-005)
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id":"uesio/core.uniquekey"},{"id": "uesio/tests.reference"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "ID-004"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.reference']['uesio/core.uniquekey']" == "ID-005"

# Operator: EQ | valueSource: PARAM
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query":true,
            "params": {"reference": "{{ID001-UUID}}"},
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.reference",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "reference"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.reference']['uesio/core.uniquekey']" == "ID-001"

# Operator: NOT_EQ | valueSource: VALUE
# entry 8
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
                    "field": "uesio/tests.reference",
                    "operator": "NOT_EQ",
                    "value": "{{ID001-UUID}}",
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" not includes "ID-001"

# Operator: NOT_EQ | valueSource: PARAM
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query":true,
            "params": {"reference": "{{ID001-UUID}}"},
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.reference",
                    "operator": "NOT_EQ",
                    "valueSource": "PARAM",
                    "param": "reference"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" not includes "ID-001"

# Operator: IN | valueSource: VALUE
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.reference",
                    "operator": "IN",
                    "valueSource": "VALUE",
                    "values": [
                        "{{ID001-UUID}}",
                        "{{ID002-UUID}}"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" includes "ID-002"

# Operator: IN | valueSource: LOOKUP
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.id"},{"id": "uesio/core.uniquekey"}],
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
            "fields": [{"id": "uesio/tests.reference"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.reference",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/core.id"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[0]['uesio/tests.reference']['uesio/core.uniquekey']" == "ID-001"


# Operator: IN | valueSource: PARAM
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "params": {
                "reference1": "{{ID001-UUID}}",
                "reference2": "{{ID002-UUID}}"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.reference",
                    "operator": "IN",
                    "valueSource": "PARAM",
                    "params": [
                        "reference1",
                        "reference2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" includes "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" not includes "ID-003"

# Operator: NOT_IN | valueSource: VALUE
# entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.reference",
                    "operator": "NOT_IN",
                    "values": [
                        "{{ID001-UUID}}",
                        "{{ID002-UUID}}"
                    ]
                },
                {
                    "field":"uesio/tests.reference",
                    "operator":"IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" not includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" not includes "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" includes "ID-003"

# Operator: NOT_IN | valueSource: LOOKUP
# entry 14
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.id"},{"id": "uesio/core.uniquekey"}],
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
            "fields": [{"id": "uesio/tests.reference"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.reference",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/core.id"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" not includes "ID-001"

# Operator: NOT_IN | valueSource: PARAM
## entry 15
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "params": {
                "reference1": "{{ID001-UUID}}",
                "reference2": "{{ID002-UUID}}"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.reference",
                    "operator": "NOT_IN",
                    "valueSource": "PARAM",
                    "params": [
                        "reference1",
                        "reference2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" not includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" not includes "ID-002"

# Operator: IS_BLANK | valueSource: VALUE
# entry 16
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.reference",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']" includes null


# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 17
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.reference",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']" not includes null
