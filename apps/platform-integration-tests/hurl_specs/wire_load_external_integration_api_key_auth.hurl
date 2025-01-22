######################################################
# Tests loading a wire whose source collection
# is an external integration with API_KEY auth
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200
[Captures]
session_id: cookie "sessid"

# This is a bit crazy but in order to authenticate here,
# we need to populate the session id secret with our current session id,
# since we don't have Uesio API Keys, the only way to access Uesio is with a sessid cookie,
# so we have to recreate that.
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.secret",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/tests.test_session_id",
                    "uesio/core.value":"{{session_id}}"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Test a wire load on the weather forecast with API KEY auth
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/tests.weather_forecast_api_key_auth",
            "query": true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/tests.current']" exists
jsonpath "$.wires[0].data[0]['uesio/tests.forecast']" exists
jsonpath "$.wires[0].data[0]['uesio/tests.forecast']" count == 7
