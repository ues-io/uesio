# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Try to navigate to the workspace home route
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.view" == "uesio/studio.workspace"
jsonpath "$.params.app" == "uesio/tests"
jsonpath "$.params.workspacename" == "dev"

# Try get config values for the dev workspace
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[0]['uesio/core.name']" == "studio_apis_url"
jsonpath "$.wires[0].data[1]['uesio/core.name']" == "test_oauth_authorize_url"
jsonpath "$.wires[0].data[2]['uesio/core.name']" == "test_oauth_scopes"
jsonpath "$.wires[0].data[3]['uesio/core.name']" == "test_oauth_token_url"
jsonpath "$.wires[0].data[4]['uesio/core.name']" == "google_auth_client_id"

# Logout
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/logout
HTTP 200

# Now log in as a user who is on the app team, but not the owner
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}
HTTP 200

# Try to navigate to the workspace home route
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.view" == "uesio/studio.workspace"
jsonpath "$.params.app" == "uesio/tests"
jsonpath "$.params.workspacename" == "dev"

# Try get config values for the dev workspace
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[0]['uesio/core.name']" == "studio_apis_url"
jsonpath "$.wires[0].data[1]['uesio/core.name']" == "test_oauth_authorize_url"
jsonpath "$.wires[0].data[2]['uesio/core.name']" == "test_oauth_scopes"
jsonpath "$.wires[0].data[3]['uesio/core.name']" == "test_oauth_token_url"
jsonpath "$.wires[0].data[4]['uesio/core.name']" == "google_auth_client_id"

# Logout
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/logout
HTTP 200

# Now test as a user that doesn't have access to the test app
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "abel"
}
HTTP 200

# Try to navigate to the workspace home route
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.dependencies.wire[0].errors[0].message" contains "workspace uesio/tests:dev does not exist or you don't have access to modify it"

# Try get config values for the dev workspace
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/configvalues
Accept: application/json
HTTP 403
[Asserts]
body contains "workspace uesio/tests:dev does not exist or you don't have access to modify it"

# Logout
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/logout
HTTP 200

# Try to navigate to the workspace home route as public user
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
# TODO: This should be a 403 or a 404 (to obscure) with only an error returned, need to refactor underlying authorization, authentication & session management code.
HTTP 200
[Asserts]
jsonpath "$.dependencies.label[?(@.name=='session_expiration_msg')]" count == 1

# Try get config values for the dev workspace as public user
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/configvalues
Accept: application/json
# TODO: This should be a 403 or a 404 (to obscure) with only an error returned, need to refactor underlying authorization, authentication & session management code.
HTTP 200
[Asserts]
header "Location" == "/login?r=%2Fworkspace%2Fuesio%2Ftests%2Fdev%2Fconfigvalues&expired=true"
body startsWith "<a href=\"/login?r=%2Fworkspace%2Fuesio%2Ftests%2Fdev%2Fconfigvalues&amp;expired=true\">OK</a>.\n\n"

