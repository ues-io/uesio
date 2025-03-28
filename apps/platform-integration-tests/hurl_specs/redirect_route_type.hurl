##############################################################################
# Tests the behavior of routes of type "redirect"
##############################################################################

# Login to get a session
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

[Captures]
session_id: cookie "sessid"

# Verify that previewing a redirect route executes a redirect
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/app/uesio/tests/redirect_test
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Cookie: sessid={{session_id}}
HTTP 302

[Asserts]
header "Location" == "https://www.ues.io"
