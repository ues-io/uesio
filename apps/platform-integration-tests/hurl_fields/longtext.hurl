######################################################
# Tests for field type LONGTEXT
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Operator: EQ | valueSource: VALUE | Bad Value as number
# entry 2
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.longtext",
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
jsonpath "$.wires[0].errors[0].message" == "failed to encode args[2]: unable to encode 1 into text format for text (OID 25): cannot find encode plan"


# Operator: EQ | valueSource: VALUE as string
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.longtext",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "test text1"
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
'uesio/tests.longtext',main.fields->'uesio/tests.longtext'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.longtext' = $3
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[0]['uesio/tests.longtext']" == "test text1"

# Operator: EQ | valueSource: PARAM
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query":true,
            "params": {
                "longtext": "test text1"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.longtext",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "longtext"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.longtext']" == "test text1"

# Operator: NOT_EQ | valueSource: VALUE
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.longtext",
                    "operator": "NOT_EQ",
                    "value": "test text1",
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "test text1"

# Operator: NOT_EQ | valueSource: PARAM
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query":true,
            "params": {
                "longtext": "test text1"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.longtext",
                    "operator": "NOT_EQ",
                    "valueSource": "PARAM",
                    "param": "longtext"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not contains "test text1"

# Operator: STARTS_WITH | valueSource: VALUE
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.longtext",
                    "operator": "STARTS_WITH",
                    "valueSource": "VALUE",
                    "value": "test text"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains "test text2"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains "test text3"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not contains ""

# Operator: STARTS_WITH | valueSource: VALUE | Bad Value
# NOTE Postgresql uses ILIKE to query the data matching 1 --> no data
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.longtext",
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
'uesio/tests.longtext',main.fields->'uesio/tests.longtext'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.longtext' ILIKE $3
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
            "fields": [{"id": "uesio/tests.longtext"}],
            "query":true,
            "params": {
                "longtext": "test text"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.longtext",
                    "operator": "STARTS_WITH",
                    "valueSource": "PARAM",
                    "param": "longtext"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains "test text2"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains "test text3"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not contains ""

# Operator: IN | valueSource: VALUE
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.longtext",
                    "operator": "IN",
                    "values": [
                        "test text1",
                        "test text2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains "test text2"

# Operator: IN | valueSource: LOOKUP
# entry 11
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.longtext"}],
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
jsonpath "$.wires[1].data[0]['uesio/tests.longtext']" == "test text1"
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "ID-001"


# Operator: IN | valueSource: PARAM
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query":true,
            "params": {
                "longtext1": "test text1",
                "longtext2": "test text2"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.longtext",
                    "operator": "IN",
                    "valueSource": "PARAM",
                    "params": [
                        "longtext1",
                        "longtext2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains "test text2"

# Operator: NOT_IN | valueSource: VALUE
# entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.longtext",
                    "operator": "NOT_IN",
                    "values": [
                        "test text1",
                        "test text2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not contains "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not contains "test text2"

# Operator: NOT_IN | valueSource: LOOKUP
# entry 14
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/tests.longtext"}],
            "conditions": [
                {
                    "field": "uesio/tests.longtext",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "test text1"
                }
            ],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "name":"condition",
            "fields": [{"id":"uesio/tests.longtext"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.longtext",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.longtext"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/tests.longtext']" not contains "test text1"

# Operator: NOT_IN | valueSource: PARAM
# entry 15
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "query":true,
            "params": {
                "longtext1": "test text1",
                "longtext2": "test text2",
                "longtext3": "test text3"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.longtext",
                    "operator": "NOT_IN",
                    "valueSource": "PARAM",
                    "params": [
                        "longtext1",
                        "longtext2",
                        "longtext3"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not contains "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not contains "test text2"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not contains "test text3"

# Operator: IS_BLANK | valueSource: VALUE
# entry 16
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.longtext",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" contains ""
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-007"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-008"

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 17
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.longtext",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not contains ""
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "ID-007"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "ID-008"
