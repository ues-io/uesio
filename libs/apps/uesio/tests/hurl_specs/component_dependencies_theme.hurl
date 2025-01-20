######################################################
# Tests theme dependencies for a route
######################################################

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Route with a theme
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_theme
HTTP 200
[Asserts]
# Verify that the theme is the one specified in the route
jsonpath "$.theme" == "uesio/tests.christmas"
jsonpath "$.dependencies.theme" count == 2
# Since we're in workspace mode, we get the builder theme as well
jsonpath "$.dependencies.theme[0].name" == "default"
jsonpath "$.dependencies.theme[0].namespace" == "uesio/builder"
jsonpath "$.dependencies.theme[1].name" == "christmas"
jsonpath "$.dependencies.theme[1].namespace" == "uesio/tests"

# Route without a theme (no app default theme specified)
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_theme_no_theme
HTTP 200
[Asserts]
# Verify that the theme is uesio/core.default
jsonpath "$.theme" == "uesio/core.default"
jsonpath "$.dependencies.theme" count == 2
# Since we're in workspace mode, we get the builder theme as well
jsonpath "$.dependencies.theme[0].name" == "default"
jsonpath "$.dependencies.theme[0].namespace" == "uesio/builder"
jsonpath "$.dependencies.theme[1].name" == "default"
jsonpath "$.dependencies.theme[1].namespace" == "uesio/core"

# Get the workspace id
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.workspace",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "uesio/tests:dev"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" nth 0 == "uesio/tests:dev"
[Captures]
workspace_id: jsonpath "$.wires[0].data[*]['uesio/core.id']" nth 0

# Set the a default theme for this workspace
POST https://{{host}}:{{port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.workspace",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id":"{{workspace_id}}",
                    "uesio/studio.defaulttheme":"uesio/tests.default"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/studio.defaulttheme']" == "uesio/tests.default"
jsonpath "$.wires[0].errors" == null


# Check again the route without a theme to see if it has the theme we just set
# Route without a theme (app default theme specified)
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_theme_no_theme
HTTP 200
[Asserts]
# Verify that the theme is uesio/tests.default
jsonpath "$.theme" == "uesio/tests.default"
jsonpath "$.dependencies.theme" count == 2
jsonpath "$.dependencies.theme[0].name" == "default"
jsonpath "$.dependencies.theme[0].namespace" == "uesio/builder"
jsonpath "$.dependencies.theme[1].name" == "default"
jsonpath "$.dependencies.theme[1].namespace" == "uesio/tests"


# Remove the a default theme for this workspace
POST https://{{host}}:{{port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.workspace",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id":"{{workspace_id}}",
                    "uesio/studio.defaulttheme":""
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/studio.defaulttheme']" == ""
jsonpath "$.wires[0].errors" == null

# Route with a theme for a SITE
GET https://tests.{{domain}}:{{port}}/site/routes/path/uesio/tests/dependencies_theme
HTTP 200
[Asserts]
# Verify that the theme is the one specified in the route
jsonpath "$.theme" == "uesio/tests.christmas"
jsonpath "$.dependencies.theme" count == 1
jsonpath "$.dependencies.theme[0].name" == "christmas"
jsonpath "$.dependencies.theme[0].namespace" == "uesio/tests"

# Route without a theme on a SITE (no app default theme specified, since we removed the default theme for the app)
GET https://tests.{{domain}}:{{port}}/site/routes/path/uesio/tests/dependencies_theme_no_theme
HTTP 200
[Asserts]
# Verify that the theme is uesio/core.default
jsonpath "$.theme" == "uesio/core.default"
jsonpath "$.dependencies.theme" count == 1
jsonpath "$.dependencies.theme[0].name" == "default"
jsonpath "$.dependencies.theme[0].namespace" == "uesio/core"
