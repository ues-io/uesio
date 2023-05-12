######################################################
# Tests loading a wire
######################################################

###
# TODO:
# create test data
# create 5 records with checkbox=blank, true, false
###

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}
HTTP 200

# Test a wire load with no conditions
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json

{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query": true,
            "batchnumber":1,
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
main.uniquekey::text AS "uesio/core.uniquekey"
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2
ORDER BY main.id::text asc
LIMIT 501```
jsonpath "$.wires[0].data[*]" count == 2




##############
#
#   AUTONUMBER
#
##############

#
#   valueSource: VALUE
#

# Test a wire load with a EQ condition on the fieldtype AUTONUMBER
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "ID-001"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 1


# Test a wire load with a NOT_EQ condition on the fieldtype AUTONUMBER
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
                    "field": "uesio/tests.autonumber",
                    "operator": "NOT_EQ",
                    "value": "ID-1",
                    "valueSource": "VALUE"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 8

# Test a wire load with a IN condition on the fieldtype AUTONUMBER
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "IN",
                    "values": [
                        "ID-001",
                        "ID-002"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 2
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" count == 2
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.autonumber']" includes "ID-002"

# Wire load with NOT IN condition and values
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "NOT_IN",
                    "values": [
                        "ID-001",
                        "ID-002"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 7
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-003"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-004"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-005"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-006"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-007"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-008"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-009"

# Test a wire load with a IS_BLANK condition on the fieldtype AUTONUMBER
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
                    "field": "uesio/tests.autonumber",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 0

# Test a wire load with a IS_NOT_BLANK condition on the fieldtype AUTONUMBER
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
                    "field": "uesio/tests.autonumber",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 9
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-001"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-009"