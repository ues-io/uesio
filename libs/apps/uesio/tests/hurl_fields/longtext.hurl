######################################################
# Tests for field type LONGTEXT
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}
HTTP 200

# Test a wire load with no conditions on wire with collection wire_condition
# entry 2
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json

{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query": true,
            "batchsize":2
        }
    ]
}
HTTP 200
[Asserts]
# If this test is failing for you, make sure you have `UESIO_DEBUG_SQL=true` set locally
# and then re-run the app
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2
ORDER BY main.id::text asc
LIMIT 3```
jsonpath "$.wires[0].data[*]" count == 2

# Operator: EQ | valueSource: VALUE
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
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" == "test text1"

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
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" == "test text1"

# Operator: NOT_EQ | valueSource: VALUE
# entry 5
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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "test text1"

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
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not includes "test text1"

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
                    "value": "test"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" includes "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" includes "test text2"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" includes "test text3"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not includes ""

# Operator: STARTS_WITH | valueSource: PARAM
# entry 7
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
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" includes "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" includes "test text2"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" includes "test text3"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not includes ""

# Operator: IN | valueSource: VALUE
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
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" includes "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" includes "test text2"

# Operator: IN | valueSource: LOOKUP
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [
                {
                    "id":"uesio/tests.longtext"
                }
            ],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.longtext",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "test text1"
                }
            ]
        },
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.longtext"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.longtext",
                    "operator": "IN",
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
jsonpath "$.wires[1].data[*]['uesio/tests.longtext']" == "test text1"


# Operator: IN | valueSource: PARAM
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
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" includes "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" includes "test text2"

# Operator: NOT_IN | valueSource: VALUE
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
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not includes "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not includes "test text2"

# Operator: NOT_IN | valueSource: LOOKUP
# entry 11
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
jsonpath "$.wires[1].data[*]['uesio/tests.longtext']" not includes "test text1"

# Operator: NOT_IN | valueSource: PARAM
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
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not includes "test text1"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not includes "test text2"
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" not includes "test text3"

# Operator: IS_BLANK | valueSource: VALUE
# This should return all text fields which are an empty string.
# entry 13
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
                    "field": "uesio/tests.longtext",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" not exists
# jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" == "" or not exits

# Operator: IS_NOT_BLANK | valueSource: VALUE
# This should return all text fields which are not an empty string.
# entry 14
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
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
# jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" != ""
jsonpath "$.wires[0].data[*]['uesio/tests.longtext']" exists