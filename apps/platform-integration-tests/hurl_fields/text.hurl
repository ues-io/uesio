######################################################
# Tests for field type TEXT
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
            "fields": [{"id": "uesio/tests.text"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.text",
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
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].error.message" == "failed to encode args[2]: unable to encode 1 into text format for text (OID 25): cannot find encode plan"

# Operator: EQ | valueSource: VALUE | value as string
# entry 3
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
jsonpath "$.wires[0].data[0]['uesio/tests.text']" == "text 1"

# Operator: EQ | valueSource: PARAM
# entry 4
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
jsonpath "$.wires[0].data[0]['uesio/tests.text']" == "text 1"

# Operator: NOT_EQ | valueSource: VALUE
# entry 5
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
# entry 6
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
# entry 7
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

# Operator: STARTS_WITH | valueSource: VALUE | Bad Value
# NOTE Postgresql uses ILIKE to query the data matching 1 --> no data
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
                    "active": true,
                    "field": "uesio/tests.text",
                    "operator": "STARTS_WITH",
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
'uesio/tests.text',main.fields->'uesio/tests.text'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.text' ILIKE $3
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[*]" isEmpty

# Operator: STARTS_WITH | valueSource: PARAM
# entry 9
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
# entry 10
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
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/core.uniquekey"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.text"}],
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
jsonpath "$.wires[1].data[0]['uesio/tests.text']" == "text 1"
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "ID-001"


# Operator: IN | valueSource: PARAM
# entry 12
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
# entry 13
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
# entry 14
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
# entry 15
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
# entry 16
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"},{"id":"uesio/core.uniquekey"}],
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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-006"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-005"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" includes ""

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 17
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.text"},{"id":"uesio/core.uniquekey"}],
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
jsonpath "$.wires[0].data[*]['uesio/tests.text']" not includes ""
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-006"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-005"
