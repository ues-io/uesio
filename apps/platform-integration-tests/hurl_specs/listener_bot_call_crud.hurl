######################################################
# Tests the crud apis for listener bots
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Invoke with all required parameters
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/call_crud
{}
HTTP 200
[Asserts]
jsonpath "$.success" == true
