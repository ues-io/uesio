######################################################
# Tests invoking listener bots
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Invoke with all required parameters
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/add_numbers
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/add_numbers
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/recursive_add_numbers
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/add_numbers
{
    "a": 1
}
HTTP 400
[Asserts]
body contains "missing required param: b"

# Invoke with invalid parameter value
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/add_numbers
{
    "a": 1,
    "b": false
}
HTTP 400
[Asserts]
body contains "could not convert param to number: b"

# Test invoking a bot that does not exist - should fail with HTTP 404
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/achieve_world_peace
{}
HTTP 404
[Asserts]
body startsWith "unable to load listener bot 'uesio/tests.achieve_world_peace'"

# Test invoking a bot as a site guest user - should succeed because access is granted
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/tests/add_numbers
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
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/tests/call_http_api
{
    "a": 1,
    "b": 2
}
HTTP 403
[Asserts]
body == "you do not have permission to call bot: uesio/tests.call_http_api\n"

# Verify that the public guest user cannot call special studio system bundles
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/logout
HTTP 200

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/createbundle
{
    "type": "major",
    "description": "attack of the killer tomatoes"
}
HTTP 403
[Asserts]
body == "you do not have permission to call bot: uesio/studio.createbundle\n"

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/workspacetruncate
{}
HTTP 403
[Asserts]
body == "you do not have permission to call bot: uesio/studio.workspacetruncate\n"

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/setworkspaceuser
{}
HTTP 403
[Asserts]
body == "you do not have permission to call bot: uesio/studio.setworkspaceuser\n"
