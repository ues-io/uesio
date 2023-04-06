######################################################
# Tests fetching component pack dependencies for a route
# to verify that we properly find dependencies that are nested
# within grid items and tabs
######################################################

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Fetch component pack dependencies - via workspace router - for Grid with nested Tabs
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_grid_and_tabs
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of grid item and tabs dependencies
jsonpath "$.dependencies.componentpack.entities['uesio/io.main'].name" == "main"
jsonpath "$.dependencies.componentpack.entities['uesio/io.chart'].name" == "chart"
jsonpath "$.dependencies.viewdef.entities['uesio/tests.dependencies_grid_and_tabs'].definition.wires.animals.collection" == "uesio/tests.animal"
jsonpath "$.dependencies.componentvariant.entities['uesio/io.tabs:uesio/io.default'].component" == "uesio/io.tabs"

# Fetch component pack dependencies - via workspace router - for a Group with nested chart
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_group
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of group component dependencies
jsonpath "$.dependencies.componentpack.entities['uesio/io.main'].name" == "main"
jsonpath "$.dependencies.componentpack.entities['uesio/io.chart'].name" == "chart"

# Fetch component pack dependencies - via workspace router - for a Table component with nested chart
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_table_columns
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of table column component dependencies
jsonpath "$.dependencies.componentpack.entities['uesio/io.main'].name" == "main"
jsonpath "$.dependencies.componentpack.entities['uesio/io.chart'].name" == "chart"
