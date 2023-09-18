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
jsonpath "$.dependencies.componentpack[0].name" == "main"
jsonpath "$.dependencies.componentpack[1].name" == "chart"
jsonpath "$.dependencies.viewdef[0].definition.wires.animals.collection" == "uesio/tests.animal"
jsonpath "$.dependencies.componentvariant[6].component" == "uesio/io.tabs"
# test loading of component variant dependencies
jsonpath "$.dependencies.componentvariant[5].component" == "uesio/io.tablabels"
jsonpath "$.dependencies.componentvariant[4].component" == "uesio/io.scrollpanel"
# test defaulting of variant for tabs component when not set in YAML
jsonpath "$.dependencies.viewdef[0].definition.components[0]['uesio/io.grid'].items[0]['uesio/io.griditem'].components[0]['uesio/io.tabs']['uesio.variant']" == "uesio/io.default"
# verify that the default variant is loaded for button without a variant
jsonpath "$.dependencies.viewdef[0].definition.components[1]['uesio/io.button']['uesio.variant']" == "uesio/io.default"
jsonpath "$.dependencies.componentvariant[1].component" == "uesio/io.button"
# verify that the requested variant is loaded for button with a variant specified
jsonpath "$.dependencies.viewdef[0].definition.components[2]['uesio/io.button']['uesio.variant']" == "uesio/io.primary"
jsonpath "$.dependencies.componentvariant[2].component" == "uesio/io.button"

# Fetch component pack dependencies - via workspace router - for a Group with nested chart
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_group
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of group component dependencies
jsonpath "$.dependencies.componentpack[0].name" == "main"
jsonpath "$.dependencies.componentpack[1].name" == "chart"

# Fetch component pack dependencies - via workspace router - for a Table component with nested chart
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_table_columns
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of table column component dependencies
jsonpath "$.dependencies.componentpack[0].name" == "main"
jsonpath "$.dependencies.componentpack[1].name" == "chart"

# Fetch component pack dependencies - via workspace router - for a View with a declarative component,
# to verify that dependent component packs are loaded
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/declarative1
HTTP 200
[Asserts]
# Verify that the io pack is loaded
jsonpath "$.dependencies.componentpack[0].name" == "main"
# Verify that our expected dependencies are loaded
jsonpath "$.dependencies.componenttype[0].name" == "declarative1"
jsonpath "$.dependencies.componenttype[0].type" == "DECLARATIVE"
jsonpath "$.dependencies.componenttype[0].definition" exists
jsonpath "$.dependencies.componenttype[0].definition" count == 2
jsonpath "$.dependencies.componenttype[0].title" not exists # no builder metadata should be loaded

GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/declarative2
HTTP 200
[Asserts]
jsonpath "$.dependencies.componentpack[0].name" == "main"
# Verify that our expected dependencies are loaded
jsonpath "$.dependencies.componenttype[0].name" == "declarative2"
jsonpath "$.dependencies.componenttype[0].type" == "DECLARATIVE"
jsonpath "$.dependencies.componenttype[0].definition" exists
jsonpath "$.dependencies.componenttype[0].definition" count == 3
jsonpath "$.dependencies.componenttype[0].slots" count == 2
jsonpath "$.dependencies.componenttype[0].title" not exists # no builder metadata should be loaded
