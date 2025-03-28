######################################################
# Tests status code for file downloads
######################################################

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Verify 200 for site file exists
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/files/uesio/core/1742564626/logowhite
HTTP 200

# TODO: This should likely return a 404, not a 403. Need to revisit consistency and approach
# to differentiating between not having permission and not being found for both authenticated
# and unauthenticated users
# Verify 403 for site file that does not exist
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/files/uesio/core/1742564626/logowhitefake
HTTP 403

# Verify 200 for workspace file that exists
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/files/uesio/tests/1742564626/turtle
HTTP 200

# Verify 404 for workspace file that does not exist
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/files/uesio/tests/1742564626/turtle2
HTTP 404


