######################################################
# Tests loading a wire whose source is an integration
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Test a wire load with no conditions
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/tests.weather_forecast",
            "query": true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data.current.day" exists
jsonpath "$.wires[0].data.current.low" exists
jsonpath "$.wires[0].data.current.avg" exists
jsonpath "$.wires[0].data.current.high" exists
