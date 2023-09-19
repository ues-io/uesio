########################################################################
# In a workspace, we need to load in the modstamps of all static files
# in the associated app, so that we ensure we don't serve stale files
########################################################################

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Fetch the route via workspace router
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/workspace_static_file_dependencies
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of grid item and tabs dependencies
jsonpath "$.dependencies.file" count == 1
jsonpath "$.dependencies.file[0].name" == "turtle"
jsonpath "$.dependencies.file[0].namespace" == "uesio/tests"
jsonpath "$.dependencies.file[0].updatedAt" > 0
