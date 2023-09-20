######################################################
# Tests Truncate
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
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
POST https://{{host}}:{{port}}/workspace/uesio/tests/truncatetests/bots/call/uesio/studio/workspacetruncate
{}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.error" == ""

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