# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Try to navigate to the workspace home route
GET https://{{host}}:{{port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.view" == "uesio/studio.workspace"
jsonpath "$.params.app" == "uesio/tests"
jsonpath "$.params.workspacename" == "dev"

# Try get config values for the dev workspace
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$" count == 5
jsonpath "$[*].name" includes "google_auth_client_id"
jsonpath "$[*].name" includes "studio_apis_url"
jsonpath "$[*].name" includes "test_oauth_token_url"
jsonpath "$[*].name" includes "test_oauth_authorize_url"
jsonpath "$[*].name" includes "test_oauth_scopes"

# Logout
POST https://{{host}}:{{port}}/site/auth/logout
HTTP 200

# Now log in as a user who is on the app team, but not the owner
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}

# Try to navigate to the workspace home route
GET https://{{host}}:{{port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.view" == "uesio/studio.workspace"
jsonpath "$.params.app" == "uesio/tests"
jsonpath "$.params.workspacename" == "dev"

# Try get config values for the dev workspace
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$" count == 5
jsonpath "$[*].name" includes "google_auth_client_id"
jsonpath "$[*].name" includes "studio_apis_url"
jsonpath "$[*].name" includes "test_oauth_authorize_url"
jsonpath "$[*].name" includes "test_oauth_token_url"
jsonpath "$[*].name" includes "test_oauth_scopes"

# Logout
POST https://{{host}}:{{port}}/site/auth/logout
HTTP 200

# Now test as a user that doesn't have access to the test app
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "abel"
}

# Try to navigate to the workspace home route
GET https://{{host}}:{{port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.view" == "uesio/core.error"
jsonpath "$.params.error" == "could not get workspace context: workspace uesio/tests:dev does not exist or you don't have access to modify it."

# Try get config values for the dev workspace
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues
Accept: application/json
HTTP 200
[Asserts]
header "Location" == "/login?r=/workspace/uesio/tests/dev/configvalues&expired=true"
body == "<a href=\"/login?r=/workspace/uesio/tests/dev/configvalues&amp;expired=true\">OK</a>.\n\n"

# Logout
POST https://{{host}}:{{port}}/site/auth/logout
HTTP 200

