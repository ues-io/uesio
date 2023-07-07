######################################################
# Tests for field type LIST subtype STRUCT
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}
HTTP 200

# Operator: EQ | valueSource: VALUE | value as list_struct
# entry 2
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_struct"},{"id": "uesio/core.uniquekey"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.list_struct",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": [
                        {
                            "required":true,
                            "selectlist":"one",
                            "name":"pepe"
                        }
                    ]
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type STRUCT are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: NOT_EQ | valueSource: VALUE
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,            
            "fields": [{"id": "uesio/tests.list_struct"},{"id": "uesio/core.uniquekey"}],
            "conditions": [
                {
                    "field": "uesio/tests.list_struct",
                    "operator": "NOT_EQ",
                    "value": [
                        {
                            "required":true,
                            "selectlist":"one",
                            "name":"pepe"
                        }
                    ],
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type STRUCT are not supported. Conditions are just supported for a list field with sub type 'TEXT'."


# Operator: IN | valueSource: VALUE
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_struct"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_struct",
                    "operator": "IN",
                    "valueSource": "VALUE",
                    "values": [
                        {"required": true},
                        {"name": "juan"}
                    ]
                }
            ] 
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type STRUCT are not supported. Conditions are just supported for a list field with sub type 'TEXT'."


# Operator: IN | valueSource: LOOKUP
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey","id":"uesio/tests.list_struct"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_struct"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_struct",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.list_struct"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type STRUCT are not supported. Conditions are just supported for a list field with sub type 'TEXT'."


# Operator: IN | valueSource: PARAM
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_struct"}],
            "query":true,
            "params": {
                "list_text1": "Hola",
                "list_text2": "world"
            },
            "conditions": [
                {
                    "field": "uesio/tests.list_struct",
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
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type STRUCT are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: NOT_IN | valueSource: VALUE
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_struct"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_struct",
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
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type STRUCT are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: NOT_IN | valueSource: LOOKUP
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey","id":"uesio/tests.list_struct"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_struct"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_struct",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.list_struct"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type STRUCT are not supported. Conditions are just supported for a list field with sub type 'TEXT'."

# Operator: NOT_IN | valueSource: PARAM
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.list_struct"}],
            "query":true,
            "params": {
                "list_text1": "Hola",
                "list_text2": "world"
            },
            "conditions": [
                {
                    "field": "uesio/tests.list_struct",
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
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type STRUCT are not supported. Conditions are just supported for a list field with sub type 'TEXT'."


# Operator: IS_BLANK | valueSource: VALUE
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_struct"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_struct",
                    "operator": "IS_BLANK"
                }
           ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type STRUCT are not supported. Conditions are just supported for a list field with sub type 'TEXT'."


# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_struct"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_struct",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body contains "Load Failed: Conditions for a list field with sup type STRUCT are not supported. Conditions are just supported for a list field with sub type 'TEXT'."
