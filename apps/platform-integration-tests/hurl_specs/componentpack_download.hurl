######################################################
# Tests status code for component packs
######################################################

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Verify 200 for site file that exists
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/componentpacks/uesio/builder/1742569077/main/runtime.js
HTTP 200

# Verify 404 for site file that does not exist
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/componentpacks/uesio/builder/1742569077/main/runtimefake.js
HTTP 404

# TODO: Add react component pack to test bundle and add HTTP 200 test

# Verify 404 for workspace file that does not exist
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/componentpacks/uesio/tests/1742316697/fakecomponentpack/runtime.js
HTTP 200
