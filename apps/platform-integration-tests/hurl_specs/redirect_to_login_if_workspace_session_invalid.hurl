##############################################################################
# Should redirect to Studio login route if workspace session is invalid
##############################################################################

# Login to get a session
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

[Captures]
session_id: cookie "sessid"
[Asserts]
cookie "sessid" exists

# Logout
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/logout
HTTP 200

[Captures]
session_id_public: cookie "sessid"
[Asserts]
cookie "sessid" exists

# Access a workspace route with an invalid session, requesting HTML
# @cookie_storage_clear
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_group
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
[Cookies]
sessid: {{session_id}}
HTTP 302
[Asserts]
cookie "sessid" not exists
header "Location" == "/login?r=%2Fworkspace%2Fuesio%2Ftests%2Fdev%2Froutes%2Fpath%2Fuesio%2Ftests%2Fdependencies_group&expired=true"

# Access a workspace route with an invalid session, requesting JSON (e.g. a fetch request)
# @cookie_storage_clear
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
Referer: {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/views/uesio/tests/dependencies_group/edit
Cookie: sessid={{session_id}}
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query": true,
            "batchsize":2
        }
    ]
}
HTTP 200
[Asserts]
cookie "sessid" not exists
header "Location" == "/login?r={{site_scheme}}%3A%2F%2Fstudio.{{site_primary_domain}}%3A{{site_port}}%2Fworkspace%2Fuesio%2Ftests%2Fdev%2Fviews%2Fuesio%2Ftests%2Fdependencies_group%2Fedit&expired=true"

# Attempt to navigate to a public route with no session id
# @cookie_storage_clear
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/routes/path/uesio/appkit/requestpassword
Accept: application/json
HTTP 200

[Asserts]
cookie "sessid" exists
cookie "sessid" not contains "{{session_id}}"
cookie "sessid" not contains "{{session_id_public}}"

# Attempt to navigate to a public route with a bad session id
# @cookie_storage_clear
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/routes/path/uesio/appkit/requestpassword
Accept: application/json
Cookie: sessid={{session_id}}
HTTP 200
[Asserts]
cookie "sessid" not exists

# Attempt to navigate to a public route with a good session id
# @cookie_storage_clear
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/routes/path/uesio/appkit/requestpassword
Accept: application/json
Cookie: sessid={{session_id_public}}
HTTP 200

[Asserts]
cookie "sessid" not exists
