######################################################
# Tests invoking listener bots that call list view generator
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Invoke with all required parameters this will work and create a new view with the name test_list_view_generator
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/generate/uesio/core/listview
{
    "collection": "uesio/tests.account",
    "fields": "uesio/tests.name",
    "name": "test_list_view_generator"
}
HTTP 200
[Asserts]
jsonpath "$.error" == ""
jsonpath "$.success" == true

# Invoke with all required parameters this will fail because we already have a view with the name test_list_view_generator
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/generate/uesio/core/listview
{
    "collection": "uesio/tests.account",
    "fields": "uesio/tests.name",
    "name": "test_list_view_generator"
}
HTTP 200
[Asserts]
jsonpath "$.error" == "Unable to create duplicate uesio/studio.view record: uesio/tests:dev:test_list_view_generator"
jsonpath "$.success" == false