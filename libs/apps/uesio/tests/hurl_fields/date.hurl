######################################################
# Tests for field type DATE
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
            "fields": [{"id": "uesio/tests.date"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.date",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "2023-05-10"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" == "2023-05-10"

# Operator: EQ | valueSource: PARAM
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query":true,
            "params": {
                "date": "2023-05-10"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.date",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "date"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" == "2023-05-10"

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
                    "field": "uesio/tests.date",
                    "operator": "NOT_EQ",
                    "value": "2023-05-10",
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-10"

# Operator: NOT_EQ | valueSource: PARAM
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query":true,
            "params": {
                "date": "2023-05-10"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.date",
                    "operator": "NOT_EQ",
                    "valueSource": "PARAM",
                    "param": "date"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-10"

# Operator: GT | valueSource: VALUE
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.date",
                    "operator": "GT",
                    "valueSource": "VALUE",
                    "value": "2023-05-12"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-12"

# Operator: GT | valueSource: PARAM
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query":true,
            "params": {
                "date": "2023-05-12"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.date",
                    "operator": "GT",
                    "valueSource": "PARAM",
                    "param": "date"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-12"

# Operator: LT | valueSource: VALUE
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.date",
                    "operator": "LT",
                    "valueSource": "VALUE",
                    "value": "2023-05-13"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-13"

# Operator: LT | valueSource: PARAM
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query":true,
            "params": {
                "date": "2023-05-13"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.date",
                    "operator": "LT",
                    "valueSource": "PARAM",
                    "param": "date"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-13"

# Operator: GTE | valueSource: VALUE
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.date",
                    "operator": "GTE",
                    "valueSource": "VALUE",
                    "value": "2023-05-12"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-13"
# Operator: GTE | valueSource: PARAM
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query":true,
            "params": {
                "date": "2023-05-12"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.date",
                    "operator": "GTE",
                    "valueSource": "PARAM",
                    "param": "date"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-13"

# Operator: LTE | valueSource: VALUE
# entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.date",
                    "operator": "LTE",
                    "valueSource": "VALUE",
                    "value": "2023-05-12"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-13"

# Operator: LTE | valueSource: PARAM
# entry 14
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query":true,
            "params": {
                "date": "2023-05-12"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.date",
                    "operator": "LTE",
                    "valueSource": "PARAM",
                    "param": "date"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-13"

# Operator: IN | valueSource: VALUE
# entry 15
#POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
#Accept: application/json
#{
#    "wires": [
#        {
#            "collection":"uesio/tests.wire_condition",
#            "fields": [{"id": "uesio/tests.date"}],
#            "query":true,
#            "conditions": [
#                {
#                    "field": "uesio/tests.date",
#                    "operator": "IN",
#                    "valueSource": "VALUE",
#                    "values": [
#                        "2023-05-10",
#                        "2023-05-12"
#                    ]
#                }
#            ]
#        }
#    ]
#}
#HTTP 200
#[Asserts]
#jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-10"
#jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"

# Operator: IN | valueSource: LOOKUP
# entry 16
#POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
#Accept: application/json
#{
#    "wires": [
#        {
#            "collection":"uesio/tests.wire_condition",
#            "name":"reference",
#            "fields": [
#                {
#                    "id":"uesio/tests.date"
#                }
#            ],
#            "query":true,
#            "batchsize":8
#        },
#        {
#            "collection":"uesio/tests.wire_condition",
#            "fields": [{"id": "uesio/tests.date"}],
#            "name":"condition",
#            "query":true,
#            "conditions": [
#                {
#                    "field": "uesio/tests.date",
#                    "operator": "IN",
#                    "valueSource": "LOOKUP",
#                    "lookupWire": "reference",
#                    "lookupField": "uesio/tests.date"
#                }
#            ]
#        }
#    ]
#}
#HTTP 200
#[Asserts]
#jsonpath "$.wires[1].data[*]['uesio/tests.date']" count == 8
                        


# Operator: IN | valueSource: PARAM
# entry 17
#POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
#Accept: application/json
#{
#    "wires": [
#        {
#            "collection":"uesio/tests.wire_condition",
#            "fields": [{"id": "uesio/tests.date"}],
#            "query":true,
#            "params": {
#                "date1": "2023-05-10",
#                "date2": "2023-05-12"
#            },
#            "conditions": [
#                {
#                    "active": true,
#                    "field": "uesio/tests.date",
#                    "operator": "IN",
#                    "valueSource": "PARAM",
#                    "params": [
#                        "date1",
#                        "date2"
#                    ]
#                }
#            ]
#        }
#    ]
#}
#HTTP 200
#[Asserts]
#jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-10"
#jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"

# Operator: NOT_IN | valueSource: VALUE
# entry 18
#POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
#Accept: application/json
#{
#    "wires": [
#        {
#            "collection":"uesio/tests.wire_condition",
#            "fields": [{"id": "uesio/tests.date"}],
#            "query":true,
#            "conditions": [
#                {
#                    "field": "uesio/tests.date",
#                    "operator": "NOT_IN",
#                    "values": [
#                        "2023-05-10",
#                        "2023-05-12"
#                    ]
#                }
#            ]
#        }
#    ]
#}
#HTTP 200
#[Asserts]
#jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-10"
#jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-12"

# Operator: NOT_IN | valueSource: LOOKUP
# entry 19
#POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
#Accept: application/json
#{
#    "wires": [
#        {
#            "collection":"uesio/tests.wire_condition",
#            "name":"reference",
#            "fields": [{"id":"uesio/tests.date"}],
#            "query":true
#        },
#        {
#            "collection":"uesio/tests.wire_condition",
#            "name":"condition",
#            "fields": [{"id":"uesio/tests.date"}],
#            "query":true,
#            "conditions": [
#                {
#                    "field": "uesio/tests.date",
#                    "operator": "NOT_IN",
#                    "valueSource": "LOOKUP",
#                    "lookupWire": "reference",
#                    "lookupField": "uesio/tests.date"
#                }
#            ]
#        }
#    ]
#}
#HTTP 200
#[Asserts]
#jsonpath "$.wires[1].data[*]" not exists

# Operator: NOT_IN | valueSource: PARAM
## entry 20
#POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
#Accept: application/json
#{
#    "wires": [
#        {
#            "collection":"uesio/tests.wire_condition",
#            "fields": [{"id": "uesio/tests.date"}],
#            "query":true,
#            "params": {
#                "date1": "2023-05-10",
#                "date2": "2023-05-12",
#                "date3": "2023-05-13"
#            },
#            "conditions": [
#                {
#                    "active": true,
#                    "field": "uesio/tests.date",
#                    "operator": "NOT_IN",
#                    "valueSource": "PARAM",
#                    "params": [
#                        "date1",
#                        "date2",
#                        "date3"
#                    ]
#                }
#            ]
#        }
#    ]
#}
#HTTP 200
#[Asserts]
#jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-10"
#jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-12"
#jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-13"

# Operator: IS_BLANK | valueSource: VALUE
# entry 21
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
                    "field": "uesio/tests.date",
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
# entry 22
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.date",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" exists