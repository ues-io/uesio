###############################################################
# Tests fetching metadata for and running integration actions
###############################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Request metadata for a core integration action with input parameters defined
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/integrationactions/describe/uesio/aikit/bedrock?action=uesio/aikit.invokemodel
HTTP 200
[Asserts]
jsonpath "$.inputs" count == 6
jsonpath "$.inputs[0].name" == "model"
jsonpath "$.inputs[0].label" == "Model"
jsonpath "$.inputs[2].name" == "temperature"
jsonpath "$.inputs[2].label" == "Temperature (0 to 1)"

# Request metadata for a tests action with input parameters defined
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/integrationactions/describe/uesio/tests/studio_apis_custom?action=add_numbers
HTTP 200
[Asserts]
jsonpath "$.inputs" count == 2
jsonpath "$.inputs[0].name" == "a"
jsonpath "$.inputs[0].label" == "A"
jsonpath "$.inputs[0].type" == "NUMBER"
jsonpath "$.inputs[0].required" == true
jsonpath "$.inputs[1].name" == "b"
jsonpath "$.inputs[1].label" == "B"
jsonpath "$.inputs[1].type" == "NUMBER"
jsonpath "$.inputs[1].required" == true

# Invoke an action with all required parameters
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/integrationactions/run/uesio/tests/studio_apis?action=add_numbers
{
    "a": 10,
    "b": 15
}
HTTP 200
[Asserts]
jsonpath "$.sum" == 25
