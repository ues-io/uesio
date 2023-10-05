# Log into the studio as uesio
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Unset the google auth source config client id value
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/configvalues/uesio/core/google_auth_client_id
{
    "value": ""
}
HTTP 200

# Verify that the google auth source config client id value was unset
GET https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/configvalues
HTTP 200
[Asserts]
jsonpath "$[1].value" == ""

# Log in to google with the wrong client id
POST https://tests.{{domain}}:{{port}}/site/auth/uesio/core/google/login
{
    "credential": "A Random Credential",
    "client_id": "The client id provided by the server should be missing for this test"
}
HTTP 400
[Asserts]
body == "google login: no client id associated with auth source\n"

# Set the google auth source config client id value
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/configvalues/uesio/core/google_auth_client_id
{
    "value": "A Totally Valid Token"
}
HTTP 200

# Verify that the google auth source config client id value was set
GET https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/configvalues
HTTP 200
[Asserts]
jsonpath "$[1].value" == "A Totally Valid Token"

# Log in to google with missing credentials
POST https://tests.{{domain}}:{{port}}/site/auth/uesio/core/google/login
{}
HTTP 400
[Asserts]
body == "google login: Key: credential not present in payload\n"

# Log in to google with the wrong client id
POST https://tests.{{domain}}:{{port}}/site/auth/uesio/core/google/login
{
    "credential": "A Random Credential",
    "client_id": "I found this token on the internet. Will it work?"
}
HTTP 400
[Asserts]
body == "google login: invalid client id\n"

# Now try to set the token in a workspace and then try to login

# Unset the google auth source config client id value
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues/uesio/core/google_auth_client_id
{
    "value": ""
}
HTTP 200

# Verify that the google auth source config client id value was unset
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues
HTTP 200
[Asserts]
jsonpath "$[1].value" == ""

# Log in to google in the workspace context (it should not have a client id set
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/auth/uesio/core/google/login
{
    "credential": "A Random Credential",
    "client_id": "A Totally Different Valid Token"
}
HTTP 400
[Asserts]
body == "google login: no client id associated with auth source\n"

# Set the google auth source config client id value
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues/uesio/core/google_auth_client_id
{
    "value": "A Valid Token for Workspace"
}
HTTP 200

# Verify that the google auth source config client id value was set
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues
HTTP 200
[Asserts]
jsonpath "$[1].value" == "A Valid Token for Workspace"

# Log in to google with the wrong client id
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/auth/uesio/core/google/login
{
    "credential": "A Random Credential",
    "client_id": "A Totally Different Valid Token"
}
HTTP 400
[Asserts]
body == "google login: invalid client id\n"

# Verify that if you try to log in with a workspace context you get an error
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 400
[Asserts]
body == "Login isn't currently supported for workspaces\n"
