###########################################################################
# Tests the Bundle Store API endpoints
###########################################################################

# Fetch published, approved bundle listtings
GET https://{{host}}:{{port}}/site/bundles/v1/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$" count >= 3
jsonpath "$[?(@.app=='uesio/builder')].description" nth 0 == "The view builder app"
jsonpath "$[?(@.app=='uesio/builder')].color" nth 0 == "#2dd4bf"
jsonpath "$[*].app" exists
jsonpath "$[*].icon" exists
jsonpath "$[*].description" exists
jsonpath "$[*].color" exists

# Get published versions for the tests/app bundle
GET https://{{host}}:{{port}}/site/bundles/v1/versions/uesio/tests/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$" count >= 1
jsonpath "$" count <= 5
jsonpath "$[*].version" exists
jsonpath "$[*].description" exists
jsonpath "$[0].description" == "test bundle"
jsonpath "$[0].version" == "v0.0.1"