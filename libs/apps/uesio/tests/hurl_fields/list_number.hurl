######################################################
# Tests for field type LIST subtype NUMBER
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
            "fields": [{"id": "uesio/tests.list_number"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "BAD_VALUE"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: EQ | valueSource: VALUE | value as list_number
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": [663355888,789456123,552244789]
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: EQ | valueSource: VALUE | value as string
# NOTE this test depends on postgresql string to array conversion
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "[663355888,552244789,789456123]"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: EQ | valueSource: PARAM
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "params": {
                "list_number": "[663355888,552244789,789456123]"
            },
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "list_number"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: NOT_EQ | valueSource: VALUE
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,            
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "NOT_EQ",
                    "value": [663355888,552244789,789456123],
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: NOT_EQ | valueSource: PARAM
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "params": {
                "list_number": "[663355888,552244789,789456123]"
            },
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "NOT_EQ",
                    "valueSource": "PARAM",
                    "param": "list_number"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: IN | valueSource: VALUE
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "IN",
                    "valueSource": "VALUE",
                    "values": [
                        663355888,
                        552244789
                    ]
                }
            ] 
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: IN | valueSource: LOOKUP
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey","id":"uesio/tests.list_number"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_number"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.list_number"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: IN | valueSource: PARAM
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_number"}],
            "query":true,
            "params": {
                "list_number1": "663355888",
                "list_number2": "552244789"
            },
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "IN",
                    "valueSource": "PARAM",
                    "params": [
                        "list_number1",
                        "list_number2"
                    ]
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: NOT_IN | valueSource: VALUE
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "NOT_IN",
                    "valueSource": "VALUE",
                    "values": [
                        663355888,
                        552244789
                    ]
                }
            ] 
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: NOT_IN | valueSource: LOOKUP
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey","id":"uesio/tests.list_number"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_number"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.list_number"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: IN | valueSource: PARAM
# entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_number"}],
            "query":true,
            "params": {
                "list_number1": "663355888",
                "list_number2": "552244789"
            },
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "NOT_IN",
                    "valueSource": "PARAM",
                    "params": [
                        "list_number1",
                        "list_number2"
                    ]
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: IS_BLANK | valueSource: VALUE
# entry 14
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "IS_BLANK"
                }
           ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 15
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type NUMBER are not supported. Conditions are just supported for a list field with sub type 'TEXT'."