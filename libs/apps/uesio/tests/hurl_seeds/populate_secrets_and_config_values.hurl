###################################################################
# Initializes secrets and config values for the TESTS app
# (whose bundle must be deployed first before we can set these values)
###################################################################

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# populate the secrets and config values needed for performing OAuth 2 authorization code flow
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.secret",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/tests.test_oauth_client_id",
                    "uesio/core.value":"test-client-id"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.secret",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/tests.test_oauth_client_secret",
                    "uesio/core.value":"test-client-secret"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/tests.test_oauth_authorize_url",
                    "uesio/core.value":"https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/mock_oauth_authorize_url"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/tests.test_oauth_token_url",
                    "uesio/core.value":"https://{{host}}:{{port}}/site/oauth2/token"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Do a check of the values set for our config values in the workspace
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "fields": [],
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "uesio/tests.studio_apis_url"
jsonpath "$.wires[0].data[0]['uesio/core.namespace']" == "uesio/tests"
jsonpath "$.wires[0].data[0]['uesio/core.name']" == "studio_apis_url"
jsonpath "$.wires[0].data[0]['uesio/core.value']" == ""
jsonpath "$.wires[0].data[0]['uesio/core.has_value']" == false
jsonpath "$.wires[0].data[1]['uesio/core.id']" == "uesio/tests.test_oauth_authorize_url"
jsonpath "$.wires[0].data[1]['uesio/core.namespace']" == "uesio/tests"
jsonpath "$.wires[0].data[1]['uesio/core.name']" == "test_oauth_authorize_url"
jsonpath "$.wires[0].data[1]['uesio/core.value']" == "https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/mock_oauth_authorize_url"
jsonpath "$.wires[0].data[1]['uesio/core.has_value']" == true
# the "scopes" config value, which we did not set, should return its default value
jsonpath "$.wires[0].data[2]['uesio/core.id']" == "uesio/tests.test_oauth_scopes"
jsonpath "$.wires[0].data[2]['uesio/core.namespace']" == "uesio/tests"
jsonpath "$.wires[0].data[2]['uesio/core.name']" == "test_oauth_scopes"
jsonpath "$.wires[0].data[2]['uesio/core.value']" == "id,refresh_token,openid,profile,email"
jsonpath "$.wires[0].data[2]['uesio/core.has_value']" == false
jsonpath "$.wires[0].data[3]['uesio/core.id']" == "uesio/tests.test_oauth_token_url"
jsonpath "$.wires[0].data[3]['uesio/core.namespace']" == "uesio/tests"
jsonpath "$.wires[0].data[3]['uesio/core.name']" == "test_oauth_token_url"
jsonpath "$.wires[0].data[3]['uesio/core.value']" == "https://{{host}}:{{port}}/site/oauth2/token"
jsonpath "$.wires[0].data[3]['uesio/core.has_value']" == true
