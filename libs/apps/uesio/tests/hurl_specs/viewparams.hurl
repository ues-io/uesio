##########################################################
# Tests loading of wires with view params of various types
#########################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test fetching metadata for the view's params
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/views/params/uesio/tests/view_params
HTTP 200
[Asserts]
jsonpath "$" count == 2
jsonpath "$[0].name" == "checkboxvalue"
jsonpath "$[0].type" == "CHECKBOX"
jsonpath "$[1].required" == false
jsonpath "$[1].name" == "numbervalue"
jsonpath "$[1].type" == "NUMBER"
jsonpath "$[1].required" == true

# Test loading a wire with NUMBER and CHECKBOX param types
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/tests.wire_condition",
            "fields": [
                {
                    "id": "uesio/tests.name"
                },
                {
                    "id": "uesio/tests.checkbox"
                },
                {
                    "id": "uesio/tests.number"
                }
            ],
            "query": true,
            "batchsize": 5,
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "checkboxvalue"
                },
                {
                    "field": "uesio/tests.number",
                    "operator": "GTE",
                    "valueSource": "PARAM",
                    "param": "numbervalue"
                }
            ],
            "params": {
                "checkboxvalue": true,
                "numbervalue": 4
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/tests.name']" == "ID-004"

# Test loading a wire without one of the parameters
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/tests.wire_condition",
            "fields": [
                {
                    "id": "uesio/tests.name"
                },
                {
                    "id": "uesio/tests.checkbox"
                },
                {
                    "id": "uesio/tests.number"
                }
            ],
            "query": true,
            "batchsize": 5,
            "conditions": [
                {
                    "field": "uesio/tests.checkbox",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "checkboxvalue"
                },
                {
                    "field": "uesio/tests.number",
                    "operator": "GTE",
                    "valueSource": "PARAM",
                    "param": "numbervalue"
                }
            ],
            "params": {
                "checkboxvalue": true
            }
        }
    ]
}
HTTP 400
[Asserts]
body == "Invalid Condition, param 'numbervalue' was not provided\n"

# Do a route load to verify view param handling is the same
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/view_params?checkboxvalue=true&numbervalue=4
HTTP 200
[Asserts]
jsonpath "$.dependencies.wire[0].data[*]" count == 1
jsonpath "$.dependencies.wire[0].data[*]['uesio/tests.name']" includes "ID-004"

