######################################################
# Tests invoking listener bots that call custom integration actions
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Invoke with all required parameters
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/call_custom_run_action
{
    "latitude": 43.43,
    "longitude": -39.12
}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.params.current.day" exists
jsonpath "$.params.forecast" count == 7

# Invoke with missing parameters
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/call_custom_run_action
{
    "latitude": -39.12
}
HTTP 400
[Asserts]
body == "missing required param: longitude\n"

# Invoke as a guest user to verify permissions enforcement
POST https://tests.{{domain}}:{{port}}/site/bots/call/uesio/tests/call_custom_run_action
{
    "latitude": 43.43,
    "longitude": -39.12
}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.params.current.day" exists
jsonpath "$.params.forecast" count == 7

# Invoke as a guest user to verify permissions enforcement
# TODO enable bots to call integration actions that return structured error responses
# which JS can make use of, rather than Go errors, which cause Bots to just die
POST https://tests.{{domain}}:{{port}}/site/bots/call/uesio/tests/call_forbidden_run_action
{}
HTTP 500


