######################################################
# Tests Truncate
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200
[Captures]
session_id: cookie "sessid"

# Test a wire load
POST https://{{host}}:{{port}}/workspace/uesio/tests/truncatetests/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count >= 0

# Test truncate listener bot
POST https://{{host}}:{{port}}/site/bots/call/uesio/studio/workspacetruncate
{
    "app": "uesio/tests",
    "workspaceName": "truncatetests"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.error" == ""

# Test truncate API
POST https://{{host}}:{{port}}/workspace/uesio/tests/truncatetests/data/truncate
{}
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Test a wire load with no conditions
POST https://{{host}}:{{port}}/workspace/uesio/tests/truncatetests/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
