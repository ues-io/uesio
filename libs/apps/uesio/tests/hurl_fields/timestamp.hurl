######################################################
# Tests for field type TIMESTAMP
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
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.timestamp",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "978307260"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" == 978307260


# Operator: EQ | valueSource: PARAM
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {"timestamp": "978307260"},
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "timestamp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" == 978307260

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
                    "field": "uesio/tests.timestamp",
                    "operator": "NOT_EQ",
                    "value": "978307260",
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978307260

# Operator: NOT_EQ | valueSource: PARAM
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {"timestamp": "978307260"},
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "NOT_EQ",
                    "valueSource": "PARAM",
                    "param": "timestamp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978307260

# Operator: GT | valueSource: VALUE
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.timestamp",
                    "operator": "GT",
                    "valueSource": "VALUE",
                    "value": "1012611720"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978307260
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1012611720

# Operator: GT | valueSource: PARAM
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {"timestamp": "1012611720"},
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "GT",
                    "valueSource": "PARAM",
                    "param": "timestamp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978307260
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1012611720

# Operator: LT | valueSource: VALUE
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.timestamp",
                    "operator": "LT",
                    "valueSource": "VALUE",
                    "value": "1046656980"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 978307260
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980

# Operator: LT | valueSource: PARAM
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {"timestamp": "1046656980"},
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "LT",
                    "valueSource": "PARAM",
                    "param": "timestamp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 978307260
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980

# Operator: GTE | valueSource: VALUE
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.timestamp",
                    "operator": "GTE",
                    "valueSource": "VALUE",
                    "value": "1012611720"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978307260
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1046656980
# Operator: GTE | valueSource: PARAM
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {"timestamp": "1012611720"},
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "GTE",
                    "valueSource": "PARAM",
                    "param": "timestamp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978307260
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1046656980

# Operator: LTE | valueSource: VALUE
# entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.timestamp",
                    "operator": "LTE",
                    "valueSource": "VALUE",
                    "value": "1012611720"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 978307260
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980

# Operator: LTE | valueSource: PARAM
# entry 14
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {"timestamp": "1012611720"},
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "LTE",
                    "valueSource": "PARAM",
                    "param": "timestamp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 978307260
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980

# Operator: IN | valueSource: VALUE
# entry 15
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.timestamp",
                    "operator": "IN",
                    "valueSource": "VALUE",
                    "values": [
                        "1012611720",
                        "1046656980"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1046656980

# Operator: IN | valueSource: LOOKUP
# entry 16
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/tests.timestamp"}],
            "query":true,
            "batchsize":8
        },
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "name":"condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.timestamp",
                    "operator": "IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.timestamp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/tests.timestamp']" count == 8

# Operator: IN | valueSource: PARAM
# entry 17
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {
                "timestamp1": "1012611720",
                "timestamp2": "1046656980"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "IN",
                    "valueSource": "PARAM",
                    "params": [
                        "timestamp1",
                        "timestamp2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1046656980

# Operator: NOT_IN | valueSource: VALUE
# entry 18
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.timestamp",
                    "operator": "NOT_IN",
                    "values": [
                        "1046656980",
                        "1081044244"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1081044244

# Operator: NOT_IN | valueSource: LOOKUP
# entry 19
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/tests.timestamp"}],
            "query":true
        },
        {
            "collection":"uesio/tests.wire_condition",
            "name":"condition",
            "fields": [{"id":"uesio/tests.timestamp"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.timestamp",
                    "operator": "NOT_IN",
                    "valueSource": "LOOKUP",
                    "lookupWire": "reference",
                    "lookupField": "uesio/tests.timestamp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]" not exists

# Operator: NOT_IN | valueSource: PARAM
## entry 20
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {
                "timestamp1": "978307260",
                "timestamp2": "1046656980",
                "timestamp3": "1081044244"
            },
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "NOT_IN",
                    "valueSource": "PARAM",
                    "params": [
                        "timestamp1",
                        "timestamp2",
                        "timestamp3"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978307260
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1081044244

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
                    "field": "uesio/tests.timestamp",
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
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "IS_NOT_BLANK",
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" exists

# Operator: BETWEEN | valueSource: VALUE
# entry 23
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": "978307260",
                    "end": "1081044244"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1046656980

# Operator: BETWEEN | valueSource: VALUE
# entry 24
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.timestamp",
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": "978307260",
                    "end": "1046656980",    
                    "inclusiveStart":true,
                    "inclusiveEnd":true
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 978307260
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1046656980