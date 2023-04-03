######################################################
# Tests fetching component pack dependencies for a route
# to verify that we properly find dependencies that are nested
# within grid items, tabs, table columns, etc.
######################################################

POST https://studio.uesio-dev.com:3000/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Fetch component pack dependencies - via workspace router
GET https://studio.uesio-dev.com:3000/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of grid item dependencies
jsonpath "$.dependencies.componentpack.entities['uesio/io.main'].name" == "main"
jsonpath "$.dependencies.componentpack.entities['uesio/io.chart'].name" == "chart"
jsonpath "$.dependencies.viewdef.entities['uesio/tests.dependencies'].definition.wires.animals.collection" == "uesio/tests.animal"
jsonpath "$.dependencies.componentvariant.entities['uesio/io.tabs:uesio/io.default'].component" == "uesio/io.tabs"
