######################################################
# Tests fetching component pack dependencies for a route
# to verify that we properly find dependencies that are nested
# within grid items and tabs
######################################################

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Fetch component pack dependencies - via workspace router - for Grid with nested Tabs
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_grid_and_tabs
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of grid item and tabs dependencies
jsonpath "$.dependencies.componentpack[0].name" == "main"
jsonpath "$.dependencies.componentpack[1].name" == "chart"
jsonpath "$.dependencies.viewdef[0].definition.wires.animals.collection" == "uesio/tests.animal"
# test loading of component variant dependencies
jsonpath "$.dependencies.componentvariant[10].component" == "uesio/io.scrollpanel"
jsonpath "$.dependencies.componentvariant[10].name" == "default"
jsonpath "$.dependencies.componentvariant[10].namespace" == "uesio/io"
jsonpath "$.dependencies.componentvariant[11].component" == "uesio/io.scrollpanel"
jsonpath "$.dependencies.componentvariant[11].namespace" == "uesio/io"
jsonpath "$.dependencies.componentvariant[11].name" == "tabpanel"
jsonpath "$.dependencies.componentvariant[12].component" == "uesio/io.tablabels"
jsonpath "$.dependencies.componentvariant[12].namespace" == "uesio/io"
jsonpath "$.dependencies.componentvariant[12].name" == "default"
jsonpath "$.dependencies.componentvariant[13].component" == "uesio/io.tabs"
jsonpath "$.dependencies.componentvariant[13].namespace" == "uesio/io"
jsonpath "$.dependencies.componentvariant[13].name" == "default"

# test defaulting of variant for tabs component when not set in YAML
jsonpath "$.dependencies.viewdef[0].definition.components[0]['uesio/io.grid'].items[0]['uesio/io.griditem'].components[0]['uesio/io.tabs']['uesio.variant']" not exists
# verify that the default variant is loaded for button without a variant
jsonpath "$.dependencies.viewdef[0].definition.components[1]['uesio/io.button']['uesio.variant']" not exists
jsonpath "$.dependencies.componentvariant[2].component" == "uesio/io.button"
# verify that the requested variant is loaded for button with a variant specified
jsonpath "$.dependencies.viewdef[0].definition.components[2]['uesio/io.button']['uesio.variant']" == "uesio/io.primary"
jsonpath "$.dependencies.componentvariant[3].component" == "uesio/io.button"

# Fetch component pack dependencies - via workspace router - for a Group with nested chart
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_group
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of group component dependencies
jsonpath "$.dependencies.componentpack[0].name" == "main"
jsonpath "$.dependencies.componentpack[1].name" == "chart"

# Fetch component pack dependencies - via workspace router - for a Table component with nested chart
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_table_columns
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of table column component dependencies
jsonpath "$.dependencies.componentpack[0].name" == "main"
jsonpath "$.dependencies.componentpack[1].name" == "chart"

# Fetch component pack dependencies - via workspace router - for a Panel with nested chart
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_panel
HTTP 200
[Asserts]
# Verify that the chart pack is loaded, to verify parsing of Panel component dependencies
jsonpath "$.dependencies.componentpack[0].name" == "main"
jsonpath "$.dependencies.componentpack[1].name" == "chart"
# verify that the default variant is loaded for the panel dialog
jsonpath "$.dependencies.viewdef[0].definition.panels.panel1['uesio.variant']" not exists
jsonpath "$.dependencies.viewdef[0].definition.panels.panel1['title']" == "My Panel"
# Verify that a manually specified variant is maintained
jsonpath "$.dependencies.viewdef[0].definition.panels.panel1.actions[0]['uesio/io.button']['uesio.variant']" == "uesio/io.primary"
jsonpath "$.dependencies.componentvariant[2].component" == "uesio/io.button"
# verify that variants are loaded
jsonpath "$.dependencies.componentvariant[*].component" contains "uesio/io.button"
jsonpath "$.dependencies.componentvariant[*].component" contains "uesio/io.dialog"
jsonpath "$.dependencies.componentvariant[*].component" contains "uesio/io.table"

# Fetch component pack dependencies - via workspace router - for a View with a declarative component,
# to verify that dependent component packs are loaded
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/declarative1
HTTP 200
[Asserts]
# Verify that the io pack is loaded
jsonpath "$.dependencies.componentpack[0].name" == "main"
# Verify that our expected component type dependencies are loaded
jsonpath "$.dependencies.componenttype[3].name" == "button"
jsonpath "$.dependencies.componenttype[5].name" == "text"
jsonpath "$.dependencies.componenttype[7].name" == "declarative1"
jsonpath "$.dependencies.componenttype[7].type" == "DECLARATIVE"
jsonpath "$.dependencies.componenttype[7].definition" exists
jsonpath "$.dependencies.componenttype[7].definition" count == 2
jsonpath "$.dependencies.componenttype[7].properties" exists
jsonpath "$.dependencies.componenttype[7].properties" count == 2
jsonpath "$.dependencies.componenttype[7].properties[0].name" == "title"
jsonpath "$.dependencies.componenttype[7].properties[0].defaultValue" == "This is a title"
jsonpath "$.dependencies.componenttype[7].properties[1].name" == "subtitle"
jsonpath "$.dependencies.componenttype[7].properties[1].defaultValue" == "This is a subtitle"
jsonpath "$.dependencies.componenttype[7].title" not exists # no builder metadata should be loaded

GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/declarative2
HTTP 200
[Asserts]
jsonpath "$.dependencies.componentpack[0].name" == "main"
#Verify that we get the view def from the declarative component
jsonpath "$.dependencies.viewdef" count == 2
# Verify that our expected dependencies are loaded
jsonpath "$.dependencies.componenttype[?(@.type=='DECLARATIVE')]" count == 3
jsonpath "$.dependencies.componenttype[11].name" == "declarative1"
jsonpath "$.dependencies.componenttype[11].definition" count == 2
jsonpath "$.dependencies.componenttype[11].definition" exists
jsonpath "$.dependencies.componenttype[11].definition" count == 2
jsonpath "$.dependencies.componenttype[11].title" not exists # no builder metadata should be loaded
jsonpath "$.dependencies.componenttype[12].name" == "declarative2"
jsonpath "$.dependencies.componenttype[12].definition" exists
jsonpath "$.dependencies.componenttype[12].definition" count == 3
jsonpath "$.dependencies.componenttype[12].slots" count == 2
jsonpath "$.dependencies.componenttype[12].slots[0].name" == "header"
jsonpath "$.dependencies.componenttype[12].slots[0].defaultContent" count == 1
jsonpath "$.dependencies.componenttype[12].slots[1].name" == "footer"
jsonpath "$.dependencies.componenttype[12].slots[1].defaultContent" not exists

# Test that components with variant properties, and variants with definitions containing variant properties,
# are propertly parsed to load these variants
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/variant_definition_dependencies
HTTP 200
[Asserts]
# Because we specify "uesio/io.three_column_grid" as the DECK variant,
# and this variant has a definition with a gridVariant property,
# we should load the corresponding "uesio/io.grid" component variant,
# along with its dependencies
jsonpath "$.dependencies.componentvariant[*].component" contains "uesio/io.deck"
jsonpath "$.dependencies.componentvariant[*].component" contains "uesio/io.grid"
jsonpath "$.dependencies.componentvariant[5].component" == "uesio/io.deck"
jsonpath "$.dependencies.componentvariant[5].name" == "three_column_grid"
jsonpath "$.dependencies.componentvariant[5].component" == "uesio/io.deck"
jsonpath "$.dependencies.componentvariant[5].definition.gridVariant" == "uesio/io.grid:uesio/io.three_columns"
jsonpath "$.dependencies.componentvariant[6].name" == "one_column"
jsonpath "$.dependencies.componentvariant[6].component" == "uesio/io.grid"
jsonpath "$.dependencies.componentvariant[7].name" == "three_columns"
jsonpath "$.dependencies.componentvariant[7].component" == "uesio/io.grid"
jsonpath "$.dependencies.componentvariant[7].extends" == "uesio/io.one_column"

GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/declarative_default_variant
HTTP 200
[Asserts]
# Because we have a default variant we should load it in
# since secondary and default are in the extends chain, we will also load those

jsonpath "$.dependencies.componentvariant" count == 13
jsonpath "$.dependencies.componentvariant[3].component" == "uesio/io.button"
jsonpath "$.dependencies.componentvariant[3].name" == "default"
jsonpath "$.dependencies.componentvariant[4].component" == "uesio/io.button"
jsonpath "$.dependencies.componentvariant[4].name" == "primary"
jsonpath "$.dependencies.componentvariant[5].component" == "uesio/io.button"
jsonpath "$.dependencies.componentvariant[5].name" == "secondary"
