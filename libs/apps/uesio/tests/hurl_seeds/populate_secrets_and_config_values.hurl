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
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/secrets/uesio/tests/test_oauth_client_id
{
    "value": "test-client-id"
}
HTTP 200

POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/secrets/uesio/tests/test_oauth_client_secret
{
    "value": "test-client-secret"
}
HTTP 200

POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues/uesio/tests/test_oauth_authorize_url
{
    "value": "https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/mock_oauth_authorize_url"
}
HTTP 200

POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues/uesio/tests/test_oauth_token_url
{
    "value": "https://{{host}}:{{port}}/site/oauth2/token"
}
HTTP 200

# Do a check of the values set for our config values in the workspace
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues
HTTP 200
[Asserts]
jsonpath "$" count == 5
jsonpath "$[1].name" == "test_oauth_authorize_url"
jsonpath "$[1].value" == "https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/mock_oauth_authorize_url"
# the "scopes" config value, which we did not set, should return its default value
jsonpath "$[2].name" == "test_oauth_scopes"
jsonpath "$[2].value" == "id,refresh_token,openid,profile,email"
jsonpath "$[3].name" == "test_oauth_token_url"
jsonpath "$[3].value" == "https://{{host}}:{{port}}/site/oauth2/token"
