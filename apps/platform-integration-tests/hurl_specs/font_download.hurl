######################################################
# Tests status code for component packs
######################################################

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Verify 200 for site font css that exists
GET https://{{host}}:{{port}}/site/fonts/uesio/io/0000000000/material_icons/font.css
HTTP 200

# Verify 404 for site font css that does not exist
GET https://{{host}}:{{port}}/site/fonts/uesio/io/0000000000/material_icons/font2.css
HTTP 404

# Verify 200 for workspace font css that exists
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/fonts/uesio/io/1738021523/roboto/font.css
HTTP 200

# Verify 404 for workspace font css that does not exist
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/fonts/uesio/io/1738021523/roboto/font2.css
HTTP 404