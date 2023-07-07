######################################################
# Tests for field type STRUCT with subtype TEXT
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}
HTTP 200

# Operator: IN | valueSource: VALUE
# entry 2
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.struct_text"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.struct_text",
                    "operator": "IN",
                    "valueSource": "VALUE",
                    "values": [
                        "{\"name\": \"Smith\"}",
                        "{\"prename\": \"John\"}"
                    ]
                }
            ] 
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "ID-001"

# Operator: IN | valueSource: LOOKUP
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey","id":"uesio/tests.struct_text"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.struct_text"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.struct_text",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.struct_text"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/core.uniquekey']" == "ID-001"


# Operator: IN | valueSource: PARAM
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.struct_text"}],
            "query":true,
            "params": {
                "struct_text1": "{\"name\":\"Smith\"}",
                "struct_text2": "{\"prename\":\"John\"}"
            },
            "conditions": [
                {
                    "field": "uesio/tests.struct_text",
                    "operator": "IN",
                    "valueSource": "PARAM",
                    "params": [
                        "struct_text1",
                        "struct_text2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "ID-001"

# Operator: NOT_IN | valueSource: VALUE
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.struct_text"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.struct_text",
                    "operator": "NOT_IN",
                    "valueSource": "VALUE",
                    "values": [
                        { "name": "Smith" },
                        { "prename": "John" }
                    ]
                }
            ] 
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-002"

# Operator: NOT_IN | valueSource: LOOKUP
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey","id":"uesio/tests.struct_text"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.struct_text"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.struct_text",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.struct_text"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/core.uniquekey']" not includes "ID-001"


# Operator: NOT_IN | valueSource: PARAM
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.struct_text"}],
            "query":true,
            "params": {
                "struct_text1": "{\"name\":\"Smith\"}",
                "struct_text2": "{\"prename\":\"John\"}"
            },
            "conditions": [
                {
                    "field": "uesio/tests.struct_text",
                    "operator": "NOT_IN",
                    "valueSource": "PARAM",
                    "params": [
                        "struct_text1",
                        "struct_text2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-001"