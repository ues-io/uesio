##############################################################################
# Tests fetching metadata about parameters for routes of different types
#############################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test fetching metadata for params of a Route that serves a View
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/params/uesio/tests/animal_details
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].name" == "recordid"
jsonpath "$[0].type" == "RECORD"
jsonpath "$[0].required" == true

# Test fetching metadata for params of a Route that runs a bot
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/params/uesio/tests/tools_api_query_params
HTTP 200
[Asserts]
jsonpath "$" count == 4
jsonpath "$[0].name" == "brand_name"
jsonpath "$[0].type" == "TEXT"
jsonpath "$[0].required" == true
jsonpath "$[1].name" == "category"
jsonpath "$[1].label" == "Category"
jsonpath "$[1].type" == "SELECT"
jsonpath "$[1].selectList" == "uesio/tests.tool_category"
jsonpath "$[2].name" == "type"
jsonpath "$[2].label" == "Type"
jsonpath "$[2].required" == false
jsonpath "$[3].name" == "limit"
jsonpath "$[3].label" == "Max results"
jsonpath "$[3].type" == "NUMBER"
jsonpath "$[3].required" == false