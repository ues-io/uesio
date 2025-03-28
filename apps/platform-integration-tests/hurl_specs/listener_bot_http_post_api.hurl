######################################################
# Tests invoking listener bots that invoke the bot HTTP APIs
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Invoke with all required parameters
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/call_http_api
{
    "a": 4,
    "b": 5
}
HTTP 200
[Asserts]
jsonpath "$.params.sum" == 9
jsonpath "$.params.multiplied" == 20
jsonpath "$.params.status" == "200 OK"
jsonpath "$.params.statusCode" == 200
jsonpath "$.params.contentType" == "text/json"
jsonpath "$.success" == true
