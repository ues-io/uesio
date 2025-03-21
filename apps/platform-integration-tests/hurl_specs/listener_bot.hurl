######################################################
# Tests invoking listener bots
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
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
jsonpath "$.params.dynamicAnswer" == 3
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
jsonpath "$.params.dynamicAnswer" == 6
jsonpath "$.success" == true

# Invoke a bot that calls another bot
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/recursive_add_numbers
{
    "a": 345,
    "b": 655
}
HTTP 200
[Asserts]
jsonpath "$.params.answer" == 1000
jsonpath "$.params.namespacedAnswer" == 1000
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

# Test invoking a bot that does not exist - should fail with HTTP 404
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/achieve_world_peace
{}
HTTP 404
[Asserts]
body startsWith "unable to load listener bot 'uesio/tests.achieve_world_peace'"

# Test invoking a bot as a site guest user - should succeed because access is granted
POST https://tests.{{domain}}:{{port}}/site/bots/call/uesio/tests/add_numbers
{
    "a": 1,
    "b": 2
}
HTTP 200
[Asserts]
jsonpath "$.params.answer" == 3
jsonpath "$.params.dynamicAnswer" == 3
jsonpath "$.success" == true

# Test invoking a bot as a site guest user - should fail because access is NOT granted
POST https://tests.{{domain}}:{{port}}/site/bots/call/uesio/tests/call_http_api
{
    "a": 1,
    "b": 2
}
HTTP 403
[Asserts]
body == "you do not have permission to call bot: uesio/tests.call_http_api\n"

# Verify that the public guest user cannot call special studio system bundles
POST https://{{host}}:{{port}}/site/auth/logout
HTTP 200

POST https://{{host}}:{{port}}/site/bots/call/uesio/studio/createbundle
{
    "type": "major",
    "description": "attack of the killer tomatoes"
}
HTTP 403
[Asserts]
body == "you do not have permission to call bot: uesio/studio.createbundle\n"

POST https://{{host}}:{{port}}/site/bots/call/uesio/studio/workspacetruncate
{}
HTTP 403
[Asserts]
body == "you do not have permission to call bot: uesio/studio.workspacetruncate\n"

POST https://{{host}}:{{port}}/site/bots/call/uesio/studio/setworkspaceuser
{}
HTTP 403
[Asserts]
body == "you do not have permission to call bot: uesio/studio.setworkspaceuser\n"
