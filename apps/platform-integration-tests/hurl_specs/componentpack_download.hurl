######################################################
# Tests status code for component packs
######################################################

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Verify 200 for site file that exists
GET https://{{host}}:{{port}}/site/componentpacks/uesio/builder/1742569077/main/runtime.js
HTTP 200

# Verify 404 for site file that does not exist
GET https://{{host}}:{{port}}/site/componentpacks/uesio/builder/1742569077/main/runtimefake.js
HTTP 404

# TODO: Add react component pack to test bundle and add HTTP 200 test

# Verify 404 for workspace file that does not exist
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/componentpacks/uesio/tests/1742316697/fakecomponentpack/runtime.js



