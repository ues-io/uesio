##############################################################################
# Tests fetching metadata about parameters for routes of different types
#############################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test fetching metadata for params of a Route that serves a View
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/params/uesio/tests/animal_details
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].name" == "recordid"
jsonpath "$[0].type" == "RECORD"
jsonpath "$[1].required" == true