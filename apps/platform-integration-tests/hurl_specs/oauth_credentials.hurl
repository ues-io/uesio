###########################################################################
# Tests populating and deleting oauth authorization code credentials
###########################################################################

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200
[Captures]
user_id: jsonpath "$.user.id"

# at this point, we should NOT have any integration credential for our user record in the workspace,
# so if we attempt to delete, it should fail
# first, verify that we don't have an access token yet.
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/core.myintegrationcredentials",
            "name": "mycredentials",
            "query": true,
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/core.integration']" == "uesio/tests.oauth2_authorization_code_1"
jsonpath "$.wires[0].data[0]['uesio/core.user']" == "{{user_id}}"
jsonpath "$.wires[0].data[0]['uesio/core.hasaccesstoken']" == false
jsonpath "$.wires[0].data[0]['uesio/core.hasrefreshtoken']" == false

# try to delete, which should fail
DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/auth/credentials/uesio/tests/oauth2_authorization_code_1
HTTP 404

# simulate initiating an authorization code exchange
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/oauth2/authorize/uesio/tests/oauth2_authorization_code_1
HTTP 200
[Captures]
oauth_state: jsonpath "$.state"
[Asserts]
jsonpath "$.authUrl" exists
jsonpath "$.state" exists

# now simulate going back to our OAuth 2 callback URL,
# which should invoke the token endpoint to exchange the authorization code for an access token
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/oauth2/callback?state={{oauth_state}}&code=abcd1234
Accept: text/html
HTTP 200

# Now we SHOULD have an access token for integration 1
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/core.myintegrationcredentials",
            "name": "mycredentials",
            "query": true,
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            },
            "conditions": [
                {
                    "field": "uesio/core.integration",
                    "operator": "EQ",
                    "value": "uesio/tests.oauth2_authorization_code_1"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.integration']" == "uesio/tests.oauth2_authorization_code_1"
jsonpath "$.wires[0].data[0]['uesio/core.user']" == "{{user_id}}"
jsonpath "$.wires[0].data[0]['uesio/core.hasaccesstoken']" == true
jsonpath "$.wires[0].data[0]['uesio/core.hasrefreshtoken']" == true

# try to delete - should work now
DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/auth/credentials/uesio/tests/oauth2_authorization_code_1
HTTP 204

# Now we SHOULD NOT have an access token for integration 1
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/core.myintegrationcredentials",
            "name": "mycredentials",
            "query": true,
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            },
            "conditions": [
                {
                    "field": "uesio/core.integration",
                    "operator": "EQ",
                    "value": "uesio/tests.oauth2_authorization_code_1"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.integration']" == "uesio/tests.oauth2_authorization_code_1"
jsonpath "$.wires[0].data[0]['uesio/core.user']" == "{{user_id}}"
jsonpath "$.wires[0].data[0]['uesio/core.hasaccesstoken']" == false
jsonpath "$.wires[0].data[0]['uesio/core.hasrefreshtoken']" == false

# test the OAuth callback error handling
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/oauth2/callback?error=invalid_request&error_description=missing+required+code+challenge
Accept: text/html
HTTP 400
[Asserts]
body contains "invalid_request: missing required code challenge"