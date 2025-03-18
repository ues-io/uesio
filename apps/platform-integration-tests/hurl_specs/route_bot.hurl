######################################################
# Tests invoking custom route bots
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Invoke with required parameters
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/app/uesio/tests/tools/by-brand/makita
HTTP 200
[Asserts]
jsonpath "$" count == 3
jsonpath "$[*].category" contains "Hand"
jsonpath "$[*].category" contains "Machine"

GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/app/uesio/tests/tools/by-brand/skil
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[*].category" contains "Power"

# Invoke without a required parameter
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/app/uesio/tests/api/tools
HTTP 400
[Asserts]
jsonpath "$.code" == 400
jsonpath "$.status" == "Bad Request"
jsonpath "$.error" == "missing required param: brand_name"

# Invoke with a parameter of the wrong type
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/app/uesio/tests/api/tools?brand_name=Makita&limit=asdfasdf
HTTP 400
[Asserts]
jsonpath "$.code" == 400
jsonpath "$.status" == "Bad Request"
jsonpath "$.error" == "could not convert param to number: limit"

# Invoke with a bad select list parameter
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/app/uesio/tests/api/tools?brand_name=Makita&limit=2&category=foooo
HTTP 400
[Asserts]
jsonpath "$.code" == 400
jsonpath "$.status" == "Bad Request"
jsonpath "$.error" == "invalid value for param: category"
jsonpath "$.details" == "allowed values: [Hand, Machine]"

# Invoke with valid parameters
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/app/uesio/tests/api/tools?brand_name=Makita&limit=1&type=drill
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].type" == "drill"

GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/app/uesio/tests/api/tools?brand_name=Makita&limit=2&category=Hand
HTTP 200
[Asserts]
jsonpath "$" count == 2
jsonpath "$[0].category" == "Hand"
jsonpath "$[1].category" == "Hand"

# Test redirects
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/app/uesio/tests/foo/latest
HTTP 302
[Asserts]
header "Location" == "https://docs.ues.io/files/foo/latest"
