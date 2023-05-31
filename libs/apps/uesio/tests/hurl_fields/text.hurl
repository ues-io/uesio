######################################################
# Tests for field type TEXT
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}
HTTP 200

# Operator: EQ | valueSource: VALUE
# entry 2
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.text",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "text 1"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.text']" == "text 1"

# Operator: EQ | valueSource: PARAM
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "query":true,
            "params": {
                "text": "text 1"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.text",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "text"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.text']" == "text 1"

# Operator: NOT_EQ | valueSource: VALUE
# entry 4
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
                    "field": "uesio/tests.text",
                    "operator": "NOT_EQ",
                    "value": "text 1",
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "text 1"

# Operator: NOT_EQ | valueSource: PARAM
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "query":true,
            "params": {
                "id": "text 1"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.text",
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
jsonpath "$.wires[0].data[*]['uesio/tests.text']" not includes "text 1"

# Operator: STARTS_WITH | valueSource: VALUE
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.text",
                    "operator": "STARTS_WITH",
                    "valueSource": "VALUE",
                    "value": "text"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes "text 1"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes "text 2"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes "text 3"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" not includes ""

# Operator: STARTS_WITH | valueSource: PARAM
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "query":true,
            "params": {
                "id": "text"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.text",
                    "operator": "STARTS_WITH",
                    "valueSource": "PARAM",
                    "param": "id"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes "text 1"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes "text 2"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes "text 3"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" not includes ""

# Operator: IN | valueSource: VALUE
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.text",
                    "operator": "IN",
                    "values": [
                        "text 1",
                        "text 2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes "text 1"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes "text 2"

# Operator: IN | valueSource: LOOKUP
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [
                {
                    "id":"uesio/tests.text"
                }
            ],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.text",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "text 1"
                }
            ]
        },
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.text",
                    "operator": "IN",
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
jsonpath "$.wires[1].data[*]['uesio/tests.text']" == "text 1"


# Operator: IN | valueSource: PARAM
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "query":true,
            "params": {
                "param1": "text 1",
                "param2": "text 2"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.text",
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
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes "text 1"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes "text 2"

# Operator: NOT_IN | valueSource: VALUE
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.text",
                    "operator": "NOT_IN",
                    "values": [
                        "text 1",
                        "text 2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.text']" not includes "text 1"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" not includes "text 2"

# Operator: NOT_IN | valueSource: LOOKUP
# entry 12
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
jsonpath "$.wires[1].data[*]['uesio/tests.text']" not includes "text 1"

# Operator: NOT_IN | valueSource: PARAM
# entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "query":true,
            "params": {
                "param1": "text 1",
                "param2": "text 2",
                "param3": "text 3"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.text",
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
jsonpath "$.wires[0].data[*]['uesio/tests.text']" not includes "text 1"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" not includes "text 2"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" not includes "text 3"

# Operator: IS_BLANK | valueSource: VALUE
# This should return all text fields which are an empty string.
# entry 14
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
                    "field": "uesio/tests.text",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" not exists
# jsonpath "$.wires[0].data[*]['uesio/tests.text']" == "" or not exits

# Operator: IS_NOT_BLANK | valueSource: VALUE
# This should return all text fields which are not an empty string.
# entry 15
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.text",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
# jsonpath "$.wires[0].data[*]['uesio/tests.text']" != ""
jsonpath "$.wires[0].data[*]['uesio/tests.text']" exists
