######################################################
# Tests for field type email
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
            "fields": [{"id": "uesio/tests.email"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.email",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "test1@test.com"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.email']" == "test1@test.com"

# Operator: EQ | valueSource: PARAM
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.email"}],
            "query":true,
            "params": {
                "id": "test1@test.com"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.email",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "id"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.email']" == "test1@test.com"

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
                    "field": "uesio/tests.email",
                    "operator": "NOT_EQ",
                    "value": "test1@test.com",
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "test1@test.com"

# Operator: NOT_EQ | valueSource: PARAM
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.email"}],
            "query":true,
            "params": {
                "id": "test1@test.com"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.email",
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
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not includes "test1@test.com"

# Operator: IN | valueSource: VALUE
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.email"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.email",
                    "operator": "IN",
                    "values": [
                        "test1@test.com",
                        "test2@test.com"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.email']" includes "test1@test.com"
jsonpath "$.wires[0].data[*]['uesio/tests.email']" includes "test2@test.com"

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
                    "id":"uesio/tests.email"
                }
            ],
            "query":true,
            "batchsize":8
        },
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.email"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.email",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.email"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/tests.email']" count == 8


# Operator: IN | valueSource: PARAM
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.email"}],
            "query":true,
            "params": {
                "param1": "test1@test.com",
                "param2": "test2@test.com"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.email",
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
jsonpath "$.wires[0].data[*]['uesio/tests.email']" includes "test1@test.com"
jsonpath "$.wires[0].data[*]['uesio/tests.email']" includes "test2@test.com"

# Operator: NOT_IN | valueSource: VALUE
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.email"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.email",
                    "operator": "NOT_IN",
                    "values": [
                        "test1@test.com",
                        "test2@test.com"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not includes "test1@test.com"
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not includes "test2@test.com"

# Operator: NOT_IN | valueSource: LOOKUP
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
                    "id":"uesio/tests.email"
                }
            ],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "name":"condition",
            "fields": [
                {
                    "id":"uesio/tests.email"
                }
            ],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.email",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.email"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]" not exists

# Operator: NOT_IN | valueSource: PARAM
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.email"}],
            "query":true,
            "params": {
                "param1": "test1@test.com",
                "param2": "test2@test.com",
                "param3": "test3@test.com"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.email",
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
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not includes "test1@test.com"
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not includes "test2@test.com"
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not includes "test3@test.com"

# Operator: IS_BLANK | valueSource: VALUE
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
                    "field": "uesio/tests.email",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not exists


# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 14
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.email"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.email",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.email']" exists