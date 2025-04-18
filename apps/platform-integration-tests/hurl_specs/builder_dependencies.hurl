######################################################
# Tests fetching builder dependencies for a route
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

# Fetch builder dependencies - via workspace router - for Display conditions
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/metadata/builder/uesio/tests/display_conditions
HTTP 200
[Asserts]
# Verify that the feature flags and labels are not loaded
# Verify that the correct view definition is returned in the payload
jsonpath "$.featureflag" isEmpty
jsonpath "$.label" isEmpty
jsonpath "$.viewdef[0].namespace" == "uesio/tests"
jsonpath "$.viewdef[0].name" == "display_conditions"
