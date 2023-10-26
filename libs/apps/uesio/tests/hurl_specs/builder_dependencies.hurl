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
jsonpath "$.featureflag[10].name" == "manage_user_access_tokens"
jsonpath "$.featureflag[10].type" == "CHECKBOX"
jsonpath "$.featureflag[10].user" == {{user_id}}

# Type Number
jsonpath "$.featureflag[11].name" == "max_domains_per_user"
jsonpath "$.featureflag[11].type" == "NUMBER"
jsonpath "$.featureflag[11].value" >= 0
jsonpath "$.featureflag[11].max" == 1000
jsonpath "$.featureflag[11].min" == 0
jsonpath "$.featureflag[11].user" == {{user_id}}
