######################################################
# Tests invoking listener bots
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}


# Invoke with all required parameters
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/add_numbers
{
    "a": 1,
    "b": 2
}
HTTP 200
[Asserts]
jsonpath "$.params.answer" == 3
jsonpath "$.success" == true

# Invoke with all three parameters
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/add_numbers
{
    "a": 1,
    "b": 2,
    "c": 3
}
HTTP 200
[Asserts]
jsonpath "$.params.answer" == 6
jsonpath "$.success" == true

# Invoke with missing required parameters
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/add_numbers
{
    "a": 1
}
HTTP 400
[Asserts]
body contains "missing required param: b"

# Invoke with invalid parameter value
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/add_numbers
{
    "a": 1,
    "b": false
}
HTTP 400
[Asserts]
body contains "could not convert param to number: b"