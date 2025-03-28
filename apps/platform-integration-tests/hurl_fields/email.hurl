######################################################
# Tests for field type email
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Test a wire load with no conditions on wire with collection wire_condition
# entry 2
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2
ORDER BY main.id asc
LIMIT 3```
jsonpath "$.wires[0].data" count == 2

# Operator: EQ | valueSource: VALUE
# entry 3
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[0]['uesio/tests.email']" == "test1@test.com"

# Operator: EQ | valueSource: PARAM
# entry 4
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[0]['uesio/tests.email']" == "test1@test.com"

# Operator: NOT_EQ | valueSource: VALUE
# entry 5
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "conditions": [
                {
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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "test1@test.com"

# Operator: NOT_EQ | valueSource: PARAM
# entry 6
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not contains "test1@test.com"

# Operator: IN | valueSource: VALUE
# entry 7
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.email']" contains "test1@test.com"
jsonpath "$.wires[0].data[*]['uesio/tests.email']" contains "test2@test.com"

# Operator: IN | valueSource: LOOKUP
# entry 8
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
            "fields": [{"id": "uesio/core.uniquekey"},{"id": "uesio/tests.email"}],
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
jsonpath "$.wires[1].data[0]['uesio/tests.email']" == "test1@test.com"
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "ID-001"


# Operator: IN | valueSource: PARAM
# entry 9
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.email']" contains "test1@test.com"
jsonpath "$.wires[0].data[*]['uesio/tests.email']" contains "test2@test.com"

# Operator: NOT_IN | valueSource: VALUE
# entry 10
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not contains "test1@test.com"
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not contains "test2@test.com"

# Operator: NOT_IN | valueSource: LOOKUP
# entry 11
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[1].data[*]" isEmpty

# Operator: NOT_IN | valueSource: PARAM
# entry 12
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not contains "test1@test.com"
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not contains "test2@test.com"
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not contains "test3@test.com"

# Operator: IS_BLANK | valueSource: VALUE
# entry 13
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.email"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.email",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.email']" contains ""
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-009"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-010"


# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 14
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.email"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.email",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.email']" not contains ""
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "ID-009"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "ID-010"
