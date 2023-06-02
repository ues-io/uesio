######################################################
# Tests for field type NUMBER
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
            "fields": [{"id": "uesio/tests.number"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": 1
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes null


# Operator: EQ | valueSource: PARAM
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "params": {
                "number": "1"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "number"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1

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
                    "field": "uesio/tests.number",
                    "operator": "NOT_EQ",
                    "value": 1,
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 1

# Operator: NOT_EQ | valueSource: PARAM
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "params": {
                "number": "1"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "NOT_EQ",
                    "valueSource": "PARAM",
                    "param": "number"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 1

# Operator: GT | valueSource: VALUE
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "GT",
                    "valueSource": "VALUE",
                    "value": 2
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 2

# Operator: GT | valueSource: PARAM
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "params": {
                "number": "2"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "GT",
                    "valueSource": "PARAM",
                    "param": "number"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 2

# Operator: LT | valueSource: VALUE
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "LT",
                    "valueSource": "VALUE",
                    "value": 3
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 2
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 3

# Operator: LT | valueSource: PARAM
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "params": {
                "number": "3"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "LT",
                    "valueSource": "PARAM",
                    "param": "number"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 2
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 3

# Operator: GTE | valueSource: VALUE
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "GTE",
                    "valueSource": "VALUE",
                    "value": 2
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 2
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 3
# Operator: GTE | valueSource: PARAM
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "params": {
                "number": "2"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "GTE",
                    "valueSource": "PARAM",
                    "param": "number"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 2
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 3

# Operator: LTE | valueSource: VALUE
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "LTE",
                    "valueSource": "VALUE",
                    "value": 2
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 2
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 3

# Operator: LTE | valueSource: PARAM
# entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "params": {
                "number": "2"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "LTE",
                    "valueSource": "PARAM",
                    "param": "number"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 2
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 3

# Operator: IN | valueSource: VALUE
# entry 14
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "IN",
                    "valueSource": "VALUE",
                    "values": [
                        1,
                        2
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 2

# Operator: IN | valueSource: LOOKUP
# entry 15
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [
                {
                    "id":"uesio/tests.number"
                }
            ],
            "query":true,
            "batchsize":8
        },
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.number"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/tests.number']" count == 8
                        


# Operator: IN | valueSource: PARAM
# entry 16
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "params": {
                "number1": "1",
                "number2": "2"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "IN",
                    "valueSource": "PARAM",
                    "params": [
                        "number1",
                        "number2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 2

# Operator: NOT_IN | valueSource: VALUE
# entry 17
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "NOT_IN",
                    "values": [
                        1,
                        2
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 2

# Operator: NOT_IN | valueSource: LOOKUP
# entry 18
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/tests.number"}],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "name":"condition",
            "fields": [{"id":"uesio/tests.number"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.number"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]" not exists

# Operator: NOT_IN | valueSource: PARAM
## entry 19
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "params": {
                "number1": "1",
                "number2": "2",
                "number3": "3"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "NOT_IN",
                    "valueSource": "PARAM",
                    "params": [
                        "number1",
                        "number2",
                        "number3"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 2
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes 3

# Operator: IS_BLANK | valueSource: VALUE
# entry 20
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
                    "field": "uesio/tests.number",
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
# entry 21
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" exists

# Operator: BETWEEN | valueSource: VALUE
# entry 22
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": 1,
                    "end": 4
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 2
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 3

# Operator: BETWEEN | valueSource: VALUE
# entry 23
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.number",
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": 1,
                    "end": 3,
                    "inclusiveStart":true,
                    "inclusiveEnd":true
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 2
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 3