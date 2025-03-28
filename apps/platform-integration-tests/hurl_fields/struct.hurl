######################################################
# Tests for field type STRUCT with subtype TEXT
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Operator: BETWEEN | valueSource: VALUE | subfield "age"
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.struct"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.struct->age",
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "start": 10,
                    "end": 30,
                    "inclusiveStart": false,
                    "inclusiveEnd": false
                }
            ] 
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "ID-001"

# Operator: EQ | valueSource: VALUE | subfield "firstname"
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.struct"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.struct->firstname",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "Michael"
                }
            ] 
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "ID-002"

# Operator: IS_BLANK | valueSource: VALUE | field: struct
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.struct"},{"id": "uesio/tests.name"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.struct",
                    "operator": "IS_BLANK"
                }
            ],
            "batchsize": 2,
            "order": [
                { "field": "uesio/tests.name", "desc": false }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/tests.name']" == "ID-004" # first non-blank
jsonpath "$.wires[0].data[1]['uesio/tests.name']" == "ID-005" # second non-blank

# Operator: IS_NOT_BLANK | valueSource: VALUE | field: struct
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "batchsize": 3,
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.struct"},{"id": "uesio/tests.name"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.struct",
                    "operator": "IS_NOT_BLANK"
                }
            ],
            "order": [
                { "field": "uesio/tests.name", "desc": false }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 3
jsonpath "$.wires[0].data[0]['uesio/tests.name']" == "ID-001"
jsonpath "$.wires[0].data[1]['uesio/tests.name']" == "ID-002"
jsonpath "$.wires[0].data[2]['uesio/tests.name']" == "ID-003"
