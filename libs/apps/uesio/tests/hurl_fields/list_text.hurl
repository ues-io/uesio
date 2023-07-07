######################################################
# Tests for field type LIST subtype TEXT
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
            "fields": [{"id": "uesio/tests.list_text"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "[Hallo,mundo,hello,world]"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: The Operator EQ is not supported for a list field. Supported operators are 'IN' and 'NOT_IN'."

# Operator: EQ | valueSource: VALUE | value as list_text
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_text"},{"id": "uesio/core.uniquekey"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": ["Hallo","mundo","hello","world"]
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: The Operator EQ is not supported for a list field. Supported operators are 'IN' and 'NOT_IN'."

# Operator: NOT_EQ | valueSource: VALUE
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,            
            "fields": [{"id": "uesio/tests.list_text"},{"id": "uesio/core.uniquekey"}],
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "NOT_EQ",
                    "value": ["Hallo","mundo","hello","world"],
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: The Operator NOT_EQ is not supported for a list field. Supported operators are 'IN' and 'NOT_IN'."

# Operator: IN | valueSource: VALUE
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_text"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "IN",
                    "valueSource": "VALUE",
                    "values": [
                        "Hallo",
                        "world"
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
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey","id":"uesio/tests.list_text"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_text"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.list_text"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/core.uniquekey']" == "ID-001"

# Operator: IN | valueSource: PARAM
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_text"}],
            "query":true,
            "params": {
                "list_text1": "Hola",
                "list_text2": "world"
            },
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "IN",
                    "valueSource": "PARAM",
                    "params": [
                        "list_text1",
                        "list_text2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-002"

# Operator: NOT_IN | valueSource: VALUE
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_text"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "NOT_IN",
                    "valueSource": "VALUE",
                    "values": [
                        "Hola",
                        "world"
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
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey","id":"uesio/tests.list_text"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_text"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.list_text"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/core.uniquekey']" not includes "ID-001"

# Operator: NOT_IN | valueSource: PARAM
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_text"}],
            "query":true,
            "params": {
                "list_text1": "Hola",
                "list_text2": "world"
            },
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "NOT_IN",
                    "valueSource": "PARAM",
                    "params": [
                        "list_text1",
                        "list_text2"
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

# Operator: IS_BLANK | valueSource: VALUE
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_text"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "IS_BLANK"
                }
           ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: The Operator IS_BLANK is not supported for a list field. Supported operators are 'IN' and 'NOT_IN'."

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_text"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_text",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: The Operator IS_NOT_BLANK is not supported for a list field. Supported operators are 'IN' and 'NOT_IN'."