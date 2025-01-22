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

# Formula field returntype checkbox formula greater than number
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [
                {"id": "uesio/tests.formula_checkbox_gt_number"},
                {"id": "uesio/tests.number"},
                {"id": "uesio/tests.autonumber"}
            ],
            "query": true,
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
jsonpath "$.wires[0].data[0]['uesio/tests.autonumber']" == "ID-001"
jsonpath "$.wires[0].data[0]['uesio/tests.formula_checkbox_gt_number']" == false

# Formula field returntype checkbox formula greater than number
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [
                {"id": "uesio/tests.formula_checkbox_gt_number"},
                {"id": "uesio/tests.number"},
                {"id": "uesio/tests.autonumber"}
            ],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "ID-006"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.autonumber']" == "ID-006"
jsonpath "$.wires[0].data[0]['uesio/tests.formula_checkbox_gt_number']" == true

# Formula field returntype checkbox formula greater than number (without field dependencies provided)
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [
                {"id": "uesio/tests.formula_checkbox_gt_number"},
                {"id": "uesio/tests.autonumber"}
            ],
            "query": true,
            "conditions": [
                {
                    "field": "uesio/tests.autonumber",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "ID-006"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.autonumber']" == "ID-006"
jsonpath "$.wires[0].data[0]['uesio/tests.formula_checkbox_gt_number']" == true
