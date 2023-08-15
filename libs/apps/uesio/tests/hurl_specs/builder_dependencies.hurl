######################################################
# Tests fetching builder dependencies for a route
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

# Fetch builder dependencies - via workspace router - for Display conditions
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/builder/uesio/tests/display_conditions
HTTP 200
[Asserts]
# Verify that the feature flags are loaded in the view builder
# Type Checkbox
jsonpath "$.featureflag.entities['uesio/studio.use_ai_signals'].name" == "use_ai_signals"
jsonpath "$.featureflag.entities['uesio/studio.use_ai_signals'].type" == "CHECKBOX"
jsonpath "$.featureflag.entities['uesio/studio.use_ai_signals'].value" == false
jsonpath "$.featureflag.entities['uesio/studio.use_ai_signals'].user" == {{user_id}}

# Type Number
jsonpath "$.featureflag.entities['uesio/studio.max_domains_per_user'].name" == "max_domains_per_user"
jsonpath "$.featureflag.entities['uesio/studio.max_domains_per_user'].type" == "NUMBER"
jsonpath "$.featureflag.entities['uesio/studio.max_domains_per_user'].value" == 5
jsonpath "$.featureflag.entities['uesio/studio.max_domains_per_user'].max" == 1000
jsonpath "$.featureflag.entities['uesio/studio.max_domains_per_user'].min" == 0
jsonpath "$.featureflag.entities['uesio/studio.max_domains_per_user'].user" == {{user_id}}