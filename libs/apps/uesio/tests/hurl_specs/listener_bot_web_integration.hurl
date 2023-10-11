######################################################
# Tests invoking listener bots that call web integrations
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Invoke with all required parameters
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/call_web_integration
{
    "a": 1,
    "b": 2
}
HTTP 200
[Asserts]
jsonpath "$.params.answer" == 3
jsonpath "$.success" == true
