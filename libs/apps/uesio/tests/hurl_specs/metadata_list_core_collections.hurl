###################################################################
# Tests the bundleable metadata wires in the core namespace
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Test a wire load with no conditions
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.signupmethod",
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.name']" == "platform"
jsonpath "$.wires[0].data[0]['uesio/core.namespace']" == "uesio/core"
jsonpath "$.wires[0].data[0]['uesio/core.authsource']" == "uesio/core.platform"
jsonpath "$.wires[0].data[0]['uesio/core.appicon']" == "hub"
