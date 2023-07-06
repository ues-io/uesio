######################################################
# Tests for field type LIST subtype NUMBER
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
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
            "fields": [{"id": "uesio/tests.list_number"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "BAD_VALUE"
                }
            ]
        }
    ]
}
HTTP 400

# Operator: EQ | valueSource: VALUE | value as list_number
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": [663355888,552244789,789456123]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" includes 663355888
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" includes 552244789
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" includes 789456123
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "ID-001"

# Operator: EQ | valueSource: VALUE | value as string
# NOTE this test depends on postgresql string to array conversion
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "[663355888,552244789,789456123]"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
main.fields->'uesio/tests.list_number' AS "uesio/tests.list_number",
main.id::text AS "uesio/core.id",
main.uniquekey AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->'uesio/tests.list_number' = $3
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" includes 663355888
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" includes 552244789
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" includes 789456123
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "ID-001"

# Operator: EQ | valueSource: PARAM
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "params": {
                "list_number": "[663355888,552244789,789456123]"
            },
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "list_number"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" includes 663355888
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" includes 552244789
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" includes 789456123
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "ID-001"

# Operator: NOT_EQ | valueSource: VALUE
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,            
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "NOT_EQ",
                    "value": [663355888,552244789,789456123],
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-001"

# Operator: NOT_EQ | valueSource: PARAM
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "params": {
                "list_number": "[663355888,552244789,789456123]"
            },
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "NOT_EQ",
                    "valueSource": "PARAM",
                    "param": "list_number"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-001"

 # Operator: IN | valueSource: VALUE
 # entry 8
 POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
 Accept: application/json
 {
     "wires": [
         {
             "collection":"uesio/tests.wire_condition",
             "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
             "query":true,
             "conditions": [
                 {
                     "field": "uesio/tests.list_number",
                     "operator": "IN",
                     "valueSource": "VALUE",
                     "values": [
                         663355888,
                         552244789
                     ]
                 }
             ] 
         }
     ]
 }
 HTTP 200
 [Asserts]
 jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "ID-001"

 # Operator: NOT_IN | valueSource: VALUE
 # entry 8
 POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
 Accept: application/json
 {
     "wires": [
         {
             "collection":"uesio/tests.wire_condition",
             "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
             "query":true,
             "conditions": [
                 {
                     "field": "uesio/tests.list_number",
                     "operator": "NOT_IN",
                     "valueSource": "VALUE",
                     "values": [
                         663355888,
                         552244789
                     ]
                 }
             ] 
         }
     ]
 }
 HTTP 200
 [Asserts]
 jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-001"

# Operator: IS_BLANK | valueSource: VALUE
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "IS_BLANK"
                }
           ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" includes null
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-002"

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.list_number"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.list_number",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.list_number']" not includes null
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-002"