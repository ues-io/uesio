##############################################################################
# Should add a content security policy to block iframing of all Uesio sites
# (until we have a way to configure this per site - see #2782)
##############################################################################

# Login to get a session
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

[Captures]
session_id: cookie "sessid"

# Access any route requesting HTML, to verify that the CSP is set
GET https://{{host}}:{{port}}/home
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Cookie: sessid={{session_id}}
HTTP 200
[Asserts]
header "Content-Security-Policy" == "frame-ancestors 'none';"
