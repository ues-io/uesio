######################################################
# Tests for field type REFERENCE
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}
HTTP 200

# Operator: EQ | valueSource: VALUE | Bad Value
# entry 2
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
HTTP 400

# Operator: EQ | valueSource: VALUE
# entry 3
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
                    "value": "0188bf16-fa95-77d7-b1f4-000bdabc86d8"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" == "ID-001"

# Operator: EQ | valueSource: PARAM
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query":true,
            "params": {"reference": "0188bf16-fa95-77d7-b1f4-000bdabc86d8"},
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
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" == "ID-001"

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
                    "active": true,
                    "field": "uesio/tests.reference",
                    "operator": "NOT_EQ",
                    "value": "0188bf16-fa95-77d7-b1f4-000bdabc86d8",
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
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query":true,
            "params": {"reference": "0188bf16-fa95-77d7-b1f4-000bdabc86d8"},
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
# entry 7
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
                        "0188bf16-fa95-77d7-b1f4-000bdabc86d8",
                        "0188bf16-fa95-7a43-8422-b665772dedb5"
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
# entry 8
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
jsonpath "$.wires[1].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" == "ID-001"


# Operator: IN | valueSource: PARAM
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "params": {
                "reference1": "0188bf16-fa95-77d7-b1f4-000bdabc86d8",
                "reference2": "0188bf16-fa95-7a43-8422-b665772dedb5"
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
# entry 10
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
                        "0188bf16-fa95-77d7-b1f4-000bdabc86d8",
                        "0188bf16-fa95-7a43-8422-b665772dedb5"
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
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.uniquekey']" includes "ID-003"

# Operator: NOT_IN | valueSource: LOOKUP
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
## entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "params": {
                "reference1": "0188bf16-fa95-77d7-b1f4-000bdabc86d8",
                "reference2": "0188bf16-fa95-7a43-8422-b665772dedb5"
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
# entry 14
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