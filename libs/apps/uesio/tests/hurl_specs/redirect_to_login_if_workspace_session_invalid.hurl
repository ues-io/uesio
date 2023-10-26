##############################################################################
# Should redirect to Studio login route if workspace session is invalid
##############################################################################

# Login to get a session
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

[Captures]
session_id: cookie "sessid"

# Logout
POST https://{{host}}:{{port}}/site/auth/logout
HTTP 200

# Access a workspace route with an invalid session, requesting HTML
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_group
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Cookie: sessid={{session_id}}
HTTP 302

[Asserts]
header "Location" == "/login?r=/workspace/uesio/tests/dev/routes/path/uesio/tests/dependencies_group&expired=true"

# Access a workspace route with an invalid session, requesting JSON (e.g. a fetch request)
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
Referer: https://{{host}}:{{port}}/workspace/uesio/tests/dev/views/uesio/tests/dependencies_group/edit
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
header "Location" == "/login?r=https://{{host}}:{{port}}/workspace/uesio/tests/dev/views/uesio/tests/dependencies_group/edit&expired=true"
