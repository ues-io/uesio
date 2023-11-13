######################################################
# Tests the crud apis for listener bots
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Invoke with all required parameters
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/call_crud
{}
HTTP 200
[Asserts]
jsonpath "$.success" == true
