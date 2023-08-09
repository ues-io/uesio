# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Try get config values for the dev workspace
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$" count == 0

# Logout
POST https://{{host}}:{{port}}/site/auth/logout
HTTP 200

# Now test as a user that doesn't have access to the test app
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"ben\"}"
}

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

