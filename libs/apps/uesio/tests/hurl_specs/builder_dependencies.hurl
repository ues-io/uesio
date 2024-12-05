######################################################
# Tests fetching builder dependencies for a route
# to verify that we properly find dependencies that are nested
# within grid items and tabs
######################################################

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Fetch builder dependencies - via workspace router - for Display conditions
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/builder/uesio/tests/display_conditions
HTTP 200
[Asserts]
# Verify that the feature flags are loaded in the view builder
# Type Checkbox
jsonpath "$.featureflag[8].name" == "manage_user_access_tokens"
jsonpath "$.featureflag[8].type" == "CHECKBOX"
jsonpath "$.featureflag[8].user" == {{user_id}}

# Type Number
jsonpath "$.featureflag[9].name" == "max_domains_per_user"
jsonpath "$.featureflag[9].type" == "NUMBER"
jsonpath "$.featureflag[9].value" >= 0
jsonpath "$.featureflag[9].user" == {{user_id}}
