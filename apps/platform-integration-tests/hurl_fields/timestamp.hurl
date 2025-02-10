######################################################
# Tests for field type TIMESTAMP
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
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.timestamp",
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
jsonpath "$.wires[0].error.message" == "invalid input syntax for type bigint: \"BAD_VALUE\""


# Operator: EQ | valueSource: VALUE | value as string
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
                    "value": "978310860"
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
'uesio/tests.timestamp',main.fields->'uesio/tests.timestamp'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
(main.fields->>'uesio/tests.timestamp')::bigint = $3
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[0]['uesio/tests.timestamp']" == 978310860

# Operator: EQ | valueSource: VALUE | Bad Value value as string (ISO-8601 UTC datetime)
# entry 4
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
                    "value": "2001-01-01T01:01:00Z"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].error.message" == "invalid input syntax for type bigint: \"2001-01-01T01:01:00Z\""

# Operator: EQ | valueSource: VALUE | value as number (unix timestamp)
# entry 5
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
                    "value": 978310860
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.timestamp']" == 978310860


# Operator: EQ | valueSource: PARAM
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {"timestamp": "978310860"},
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
jsonpath "$.wires[0].data[0]['uesio/tests.timestamp']" == 978310860

# Operator: NOT_EQ | valueSource: VALUE
# entry 7
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
                    "value": 978310860,
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978310860

# Operator: NOT_EQ | valueSource: PARAM
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {"timestamp": "978310860"},
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
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978310860

# Operator: GT | valueSource: VALUE
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
                    "operator": "GT",
                    "valueSource": "VALUE",
                    "value": 1012611720
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978310860
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1012611720

# Operator: GT | valueSource: PARAM
# entry 10
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
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978310860
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1012611720

# Operator: LT | valueSource: VALUE
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
                    "operator": "LT",
                    "valueSource": "VALUE",
                    "value": 1046656980
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 978310860
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980

# Operator: LT | valueSource: PARAM
# entry 12
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
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 978310860
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980

# Operator: GTE | valueSource: VALUE
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
                    "operator": "GTE",
                    "valueSource": "VALUE",
                    "value": 1012611720
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978310860
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1046656980

# Operator: GTE | valueSource: PARAM
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
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978310860
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1046656980

# Operator: LTE | valueSource: VALUE
# entry 15
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
                    "value": 1012611720
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 978310860
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980

# Operator: LTE | valueSource: PARAM
# entry 16
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
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 978310860
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980

# Operator: IN | valueSource: VALUE
# entry 17
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
                        1012611720,
                        1046656980
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
# entry 18
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name":"reference",
            "fields": [{"id":"uesio/tests.timestamp"},{"id":"uesio/core.uniquekey"}],
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.timestamp"}],
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
jsonpath "$.wires[1].data[0]['uesio/tests.timestamp']" == 978310860
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "ID-001"

# Operator: IN | valueSource: PARAM
# entry 19
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
# entry 20
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
                        1046656980,
                        1081044244
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
# entry 21
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
jsonpath "$.wires[1].data[*]" isEmpty

# Operator: NOT_IN | valueSource: PARAM
## entry 22
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.timestamp"}],
            "query":true,
            "params": {
                "timestamp1": "978310860",
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
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 978310860
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1046656980
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes 1081044244

# Operator: IS_BLANK | valueSource: VALUE
# entry 23
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.timestamp"}],
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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-009"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-010"
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes null

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 24
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.timestamp"}],
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
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" not includes null
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-009"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-010"


# Operator: BETWEEN | valueSource: VALUE
# entry 25
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
                    "start": 978310860,
                    "end": 1081044244
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
# entry 26
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
                    "start": 978310860,
                    "end": 1046656980,
                    "inclusiveStart":true,
                    "inclusiveEnd":true
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 978310860
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1012611720
jsonpath "$.wires[0].data[*]['uesio/tests.timestamp']" includes 1046656980
