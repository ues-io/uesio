######################################################
# Tests for field type multiselect
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Operator: HAS_ANY | valueSource: VALUE | as string
# entry 2
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields": [{"id":"uesio/tests.multiselect"},{"id":"uesio/core.uniquekey"}],
            "conditions": [
                {
                    "field": "uesio/tests.multiselect",
                    "valueSource": "VALUE",
                    "operator": "HAS_ANY",
                    "values": [
                        "one",
                        "two"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-003"

# Operator: HAS_ANY | valueSource: VALUE | Bad Value | as number
# entry 3
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields": [{"id":"uesio/tests.multiselect"},{"id":"uesio/core.uniquekey"}],
            "conditions": [
                {
                    "field": "uesio/tests.multiselect",
                    "valueSource": "VALUE",
                    "operator": "HAS_ANY",
                    "values": [
                        1,
                        2
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].errors[0].message" contains "failed to encode args[2]: unable to encode []interface {}{1, 2} into binary format for _text (OID 1009): unable to encode 1"

# Operator: HAS_ANY | valueSource: PARAM
# entry 4
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields": [{"id":"uesio/tests.multiselect"},{"id":"uesio/core.uniquekey"}],
            "params": {
                "one": "one",
                "two": "two"
            },
            "conditions": [
                {
                    "field": "uesio/tests.multiselect",
                    "valueSource": "PARAM",
                    "operator": "HAS_ANY",
                    "params": [
                        "one",
                        "two"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-003"

# Operator: HAS_ALL | valueSource: VALUE | as string
# entry 5
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields": [{"id":"uesio/tests.multiselect"},{"id":"uesio/core.uniquekey"}],
            "conditions": [
                {
                    "field": "uesio/tests.multiselect",
                    "valueSource": "VALUE",
                    "operator": "HAS_ALL",
                    "values": [
                        "one",
                        "two"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "ID-003"

# Operator: HAS_ALL | valueSource: VALUE | Bad Value | as number
# entry 6
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields": [{"id":"uesio/tests.multiselect"},{"id":"uesio/core.uniquekey"}],
            "conditions": [
                {
                    "field": "uesio/tests.multiselect",
                    "valueSource": "VALUE",
                    "operator": "HAS_ALL",
                    "values": [
                        1,
                        2
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].errors[0].message" contains "failed to encode args[2]: unable to encode []interface {}{1, 2} into binary format for _text (OID 1009): unable to encode 1"

# Operator: HAS_ALL | valueSource: PARAM
# entry 7
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields": [{"id":"uesio/tests.multiselect"},{"id":"uesio/core.uniquekey"}],
            "params": {
                "one": "one",
                "two": "two"
            },
            "conditions": [
                {
                    "field": "uesio/tests.multiselect",
                    "valueSource": "PARAM",
                    "operator": "HAS_ALL",
                    "params": [
                        "one",
                        "two"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "ID-003"

# Operator: IS_BLANK | valueSource: VALUE
# entry 8
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields": [{"id":"uesio/tests.multiselect"},{"id":"uesio/core.uniquekey"}],
            "conditions": [
                {
                    "field": "uesio/tests.multiselect",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-005"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "ID-003"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "ID-004"
jsonpath "$.wires[0].data[*]['uesio/tests.multiselect']" contains null


# Operator: IS_NOT_BLANK | valueSource: VALUE
# entry 9
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.multiselect"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.multiselect",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-003"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "ID-004"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" not contains "ID-005"
jsonpath "$.wires[0].data[*]['uesio/tests.multiselect']" not contains null
