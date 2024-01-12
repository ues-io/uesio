###########################################################################
# Tests the Bundle Store API endpoints
###########################################################################

GET https://{{host}}:{{port}}/site/bundles/v1/versions/uesio/tests/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$" count == 1