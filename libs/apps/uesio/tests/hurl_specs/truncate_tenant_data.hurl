######################################################
# Tests Truncate
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Test a wire load
POST https://{{host}}:{{port}}/workspace/uesio/tests/truncatetests/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" count >= 0

# Test truncate API
POST https://{{host}}:{{port}}/workspace/uesio/tests/truncatetests/data/truncate
HTTP 200

# Test a wire load with no conditions
POST https://{{host}}:{{port}}/workspace/uesio/tests/truncatetests/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" not exists