######################################################
# Tests invoking listener bots created in a workspace from a bundle
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Invoke with all required parameters
POST https://{{host}}:{{port}}/workspace/uesio/tests/quickstart/bots/call/uesio/tests/add_numbers
{
    "a": 1,
    "b": 2
}
HTTP 200
[Asserts]
jsonpath "$.params.answer" == 3
jsonpath "$.params.dynamicAnswer" == 3
jsonpath "$.success" == true
