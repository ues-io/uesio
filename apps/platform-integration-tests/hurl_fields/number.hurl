######################################################
# Tests for field type NUMBER
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
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
            "fields": [{"id": "uesio/tests.number"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "BAD_VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].errors[0].message" == "invalid input syntax for type json"

# Operator: EQ | valueSource: VALUE | value as number
# entry 3
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
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey,
'uesio/tests.number',main.fields->'uesio/tests.number'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->'uesio/tests.number' = $3
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes null

# Operator: EQ | valueSource: VALUE | value as string
# NOTE this test depends on postgresql string to number conversion
# entry 4
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
                    "value": "1"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey,
'uesio/tests.number',main.fields->'uesio/tests.number'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->'uesio/tests.number' = $3
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes 1
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes null


# Operator: EQ | valueSource: PARAM
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
                "number": "1"
            },
            "conditions": [
                {
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
                "number": "2"
            },
            "conditions": [
                {
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
                "number": "3"
            },
            "conditions": [
                {
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
# entry 14
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
# entry 15
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
# entry 16
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
# entry 17
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
        },
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.number"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/core.uniquekey"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[0]['uesio/tests.number']" == 1
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "ID-001"

# Operator: IN | valueSource: PARAM
# entry 18
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
# entry 19
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
# entry 20
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
                },
                {
                    "field":"uesio/tests.user",
                    "operator":"IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]" isEmpty

# Operator: NOT_IN | valueSource: PARAM
## entry 21
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
# entry 22
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "IS_BLANK"
                }
           ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" includes null
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-008"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-009"

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 23
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.number",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.number']" not includes null
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-008"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-009"

# Operator: BETWEEN | valueSource: VALUE
# entry 24
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

# Operator: BETWEEN | valueSource: VALUE | inclusiveStart but and inclusiveEnd
# entry 25
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


# Operator: BETWEEN | valueSource: VALUE | inclusiveStart but not inclusiveEnd
# entry 26
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
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": 1,
                    "end": 3,
                    "inclusiveStart":true,
                    "inclusiveEnd":false
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

# Operator: BETWEEN | valueSource: VALUE | not inclusiveStart but inclusiveEnd
# entry 27
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
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": 1,
                    "end": 3,
                    "inclusiveStart":false,
                    "inclusiveEnd":true
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
