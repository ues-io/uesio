######################################################
# Tests invoking listener bots that call custom integration actions
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Invoke with all required parameters
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/call_custom_run_action
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/call_custom_run_action
{
    "latitude": -39.12
}
HTTP 400
[Asserts]
body contains "missing required param: longitude"

# Invoke as a guest user to verify permissions enforcement
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/tests/call_custom_run_action
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
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/tests/call_forbidden_run_action
{}
HTTP 400
[Asserts]
body contains "GoError: you do not have permission to run action uesio/tests.privileged_action for integration uesio/tests.weather_api"


