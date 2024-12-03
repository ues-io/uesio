######################################################
# Tests for field type CHECKBOX
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
            "fields": [{"id": "uesio/tests.checkbox"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "BAD_VALUE"
                }
            ]
        }
    ]
}
HTTP 400

# Operator: EQ | valueSource: VALUE | Boolean true
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.checkbox"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": true
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
'uesio/tests.checkbox',main.fields->'uesio/tests.checkbox'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
(main.fields->>'uesio/tests.checkbox')::boolean = $3
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes true
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes null
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes false

# Operator: EQ | valueSource: VALUE | String "false"
# NOTE this test depends on postgresql boolean conversion
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.checkbox"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "false"
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
'uesio/tests.checkbox',main.fields->'uesio/tests.checkbox'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
(main.fields->>'uesio/tests.checkbox')::boolean = $3
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes false
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes null
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes true


# Operator: EQ | valueSource: PARAM
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.checkbox"}],
            "query":true,
            "params": {
                "boolean": "true"
            },
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "boolean"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes true
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes null
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes false

# Operator: NOT_EQ | valueSource: VALUE
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.checkbox"}],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "NOT_EQ",
                    "valueSource": "VALUE",
                    "value": true
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes false
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes null
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes true

# Operator: NOT_EQ | valueSource: PARAM
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.checkbox"}],
            "query":true,
            "params": {
                "boolean": "true"
            },
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "NOT_EQ",
                    "valueSource": "PARAM",
                    "param": "boolean"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes true
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes false
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes null

# Operator: IS_BLANK | valueSource: VALUE
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.checkbox"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes null
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes true
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes false
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-005"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "ID-006"

# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.checkbox"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes true
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" includes false
jsonpath "$.wires[0].data[*]['uesio/tests.checkbox']" not includes null
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-005"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not includes "ID-006"
