######################################################
# Tests for field type CHECKBOX
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
            "fields": [{"id": "uesio/tests.checkbox"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": true
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes true
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes null
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes false

# Operator: EQ | valueSource: PARAM
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.checkbox"}],
            "query":true,
            "params": {
                "boolean": "true"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.checkbox",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "boolean"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes true
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes null
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes false

# Operator: NOT_EQ | valueSource: VALUE
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.checkbox"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "NOT_EQ",
                    "valueSource": "VALUE",
                    "value": true
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes false
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes true

# Operator: NOT_EQ | valueSource: PARAM
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.checkbox"}],
            "query":true,
            "params": {
                "boolean": "true"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.checkbox",
                    "operator": "NOT_EQ",
                    "valueSource": "PARAM",
                    "param": "boolean"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes true
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes false
