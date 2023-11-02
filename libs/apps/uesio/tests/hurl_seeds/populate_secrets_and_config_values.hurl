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

POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues/uesio/tests/test_oauth_scopes
{
    "value": "id,refresh_token"
}
HTTP 200