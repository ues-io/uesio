######################################################
# Tests invoking listener bots that call list view generator
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Invoke with all required parameters this will work and create a new view with the name test_list_view_generator
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/metadata/generate/uesio/core/view
{
    "name": "test_list_view_generator"
}
HTTP 200
[Asserts]
jsonpath "$.error" == ""
jsonpath "$.success" == true

# Invoke with all required parameters this should succeed
# because we allow overwriting existing views
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/metadata/generate/uesio/core/view
{
    "name": "test_list_view_generator"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true
