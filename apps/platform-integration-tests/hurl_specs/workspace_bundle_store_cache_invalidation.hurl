####################################################
# Tests workspace bundle store cache invalidation
####################################################
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Access the deps route for previewing this route,
# which should have been seeded in the workspace bundle store cache via lines 227-232 of app_and_workspace.hurl,
# to verify that when we deployed the workspace, the workspace bundle store cache items were invalidated.
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/cacheinvalidationtest
HTTP 200
[Asserts]
jsonpath "$.dependencies.viewdef[0].definition.wires.animals.collection" == "uesio/tests.animal" 
jsonpath "$.dependencies.wire" count == 1
jsonpath "$.dependencies.wire[0].name" == "animals"