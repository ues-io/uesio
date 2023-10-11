######################################################
# Tests for field type DATE
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
            "fields": [{"id": "uesio/tests.date"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.date",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": 20230510
                }
            ]
        }
    ]
}
HTTP 400

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
jsonpath "$.wires[0].data[0]['uesio/tests.date']" == "2023-05-10"

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
jsonpath "$.wires[0].data[0]['uesio/tests.date']" == "2023-05-10"

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
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-15"

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
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-15"

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
                   "field": "uesio/tests.date",
                   "operator": "IN",
                   "valueSource": "VALUE",
                   "values": [
                       "2023-05-10",
                       "2023-05-12"
                   ]
               }
           ]
       }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"

# Operator: IN | valueSource: LOOKUP
# entry 16
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
           "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.date"}],
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
jsonpath "$.wires[1].data[0]['uesio/tests.date']" == "2023-05-10"
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "ID-001"

# Operator: IN | valueSource: PARAM
# entry 17
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
   "wires": [
       {
           "collection":"uesio/tests.wire_condition",
           "fields": [{"id": "uesio/tests.date"}],
           "query":true,
           "params": {
               "date1": "2023-05-10",
               "date2": "2023-05-12"
           },
           "conditions": [
               {
                   "active": true,
                   "field": "uesio/tests.date",
                   "operator": "IN",
                   "valueSource": "PARAM",
                   "params": [
                       "date1",
                       "date2"
                   ]
               }
           ]
       }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"

# Operator: NOT_IN | valueSource: VALUE
# entry 18
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
                   "field": "uesio/tests.date",
                   "operator": "NOT_IN",
                   "values": [
                       "2023-05-10",
                       "2023-05-12"
                   ]
               }
           ]
       }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-12"

# Operator: NOT_IN | valueSource: LOOKUP
# entry 19
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
   "wires": [
       {
           "collection":"uesio/tests.wire_condition",
           "name":"reference",
           "fields": [{"id":"uesio/tests.date"}],
           "query":true
       },
       {
           "collection":"uesio/tests.wire_condition",
           "name":"condition",
           "fields": [{"id":"uesio/tests.date"}],
           "query":true,
           "conditions": [
               {
                   "field": "uesio/tests.date",
                   "operator": "NOT_IN",
                   "valueSource": "LOOKUP",
                   "lookupWire": "reference",
                   "lookupField": "uesio/tests.date"
               }
           ]
       }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]" isEmpty

# Operator: NOT_IN | valueSource: PARAM
## entry 20
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
   "wires": [
       {
           "collection":"uesio/tests.wire_condition",
           "fields": [{"id": "uesio/tests.date"}],
           "query":true,
           "params": {
               "date1": "2023-05-10",
               "date2": "2023-05-12",
               "date3": "2023-05-13"
           },
           "conditions": [
               {
                   "active": true,
                   "field": "uesio/tests.date",
                   "operator": "NOT_IN",
                   "valueSource": "PARAM",
                   "params": [
                       "date1",
                       "date2",
                       "date3"
                   ]
               }
           ]
       }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-12"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" not includes "2023-05-13"

# Operator: IS_BLANK | valueSource: VALUE
# entry 21
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"},{"id": "uesio/core.uniquekey"}],
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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-008"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-009"

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 22
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.date"},{"id": "uesio/core.uniquekey"}],
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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-008"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-009"

# Operator: BETWEEN | valueSource: VALUE
# entry 23
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
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": "2023-05-10",
                    "end": "2023-05-14"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-13"

# Operator: BETWEEN | valueSource: VALUE | inclusiveStart and inclusiveEnd
# entry 25
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
                    "field": "uesio/tests.date",
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": "2023-05-10",
                    "end": "2023-05-13",
                    "inclusiveStart": true,
                    "inclusiveEnd": true
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-10"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-12"
jsonpath "$.wires[0].data[*]['uesio/tests.date']" includes "2023-05-13"

# Operator: BETWEEN | valueSource: VALUE | inclusiveStart but not inclusiveEnd
# entry 26
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
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": "2023-05-10",
                    "end": "2023-05-13",
                    "inclusiveStart": true,
                    "inclusiveEnd": false
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

# Operator: BETWEEN | valueSource: VALUE | not inclusiveStart but inclusiveEnd
# entry 27
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
                    "field": "uesio/tests.date",
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": "2023-05-10",
                    "end": "2023-05-13",
                    "inclusiveStart": false,
                    "inclusiveEnd": true
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
