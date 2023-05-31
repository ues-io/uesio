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

# Operator: EQ | valueSource: VALUE
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
                    "value": "018866ff-448c-7ef7-afb8-50c41c6d1db1"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" == "018866ff-448c-7ef7-afb8-50c41c6d1db1"

# Operator: EQ | valueSource: PARAM
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query":true,
            "params": {"reference": "018866ff-448c-79be-b323-78319f8fbb43"},
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
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" == "018866ff-448c-79be-b323-78319f8fbb43"

# Operator: NOT_EQ | valueSource: VALUE
# entry 6
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
                    "value": "018866ff-448c-79be-b323-78319f8fbb43",
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" not includes "018866ff-448c-79be-b323-78319f8fbb43"

# Operator: NOT_EQ | valueSource: PARAM
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query":true,
            "params": {"reference": "018866ff-448c-79be-b323-78319f8fbb43"},
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
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" != "018866ff-448c-79be-b323-78319f8fbb43"

# Operator: IN | valueSource: VALUE
# entry 8
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
                        "018866ff-448c-79be-b323-78319f8fbb43",
                        "018866ff-448c-78bc-a4b5-fdb98dbcc8fd"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" includes "018866ff-448c-79be-b323-78319f8fbb43"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" includes "018866ff-448c-78bc-a4b5-fdb98dbcc8fd"

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
                    "id":"uesio/core.id"
                }
            ],
            "query":true,
            "batchsize":8
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
jsonpath "$.wires[1].data[*]['uesio/tests.reference']['uesio/core.id']" count == 8


# Operator: IN | valueSource: PARAM
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query":true,
            "params": {
                "reference1": "018866ff-448c-79be-b323-78319f8fbb43",
                "reference2": "018866ff-448c-78bc-a4b5-fdb98dbcc8fd"
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
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" includes "018866ff-448c-79be-b323-78319f8fbb43"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" includes "018866ff-448c-78bc-a4b5-fdb98dbcc8fd"

# Operator: NOT_IN | valueSource: VALUE
# entry 11
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
                    "operator": "NOT_IN",
                    "values": [
                        "018866ff-448c-79be-b323-78319f8fbb43",
                        "018866ff-448c-78bc-a4b5-fdb98dbcc8fd"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" not includes "018866ff-448c-79be-b323-78319f8fbb43"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" not includes "018866ff-448c-78bc-a4b5-fdb98dbcc8fd"

# Operator: NOT_IN | valueSource: LOOKUP
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.id"}],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "name":"condition",
            "fields": [{"id":"uesio/tests.reference"}],
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
jsonpath "$.wires[1].data[*]" not exists

# Operator: NOT_IN | valueSource: PARAM
## entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.reference"}],
            "query":true,
            "params": {
                "reference1": "018866ff-448c-79be-b323-78319f8fbb43",
                "reference2": "018866ff-448c-78bc-a4b5-fdb98dbcc8fd",
                "reference3": "018866ff-448c-794c-9a3b-bf37d57982b2"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.reference",
                    "operator": "NOT_IN",
                    "valueSource": "PARAM",
                    "params": [
                        "reference1",
                        "reference2",
                        "reference3"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" not includes "018866ff-448c-79be-b323-78319f8fbb43"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" not includes "018866ff-448c-78bc-a4b5-fdb98dbcc8fd"
jsonpath "$.wires[0].data[*]['uesio/tests.reference']['uesio/core.id']" not includes "018866ff-448c-794c-9a3b-bf37d57982b2"

# Operator: IS_BLANK | valueSource: VALUE
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
                    "field": "uesio/tests.reference",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" not exists


# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 15
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
jsonpath "$.wires[0].data[*]['uesio/tests.reference']" exists