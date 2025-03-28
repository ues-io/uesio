######################################################
# Tests fetching invalid routes to verify error handling
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test fetching a route as though we are a browser expecting HTML,
# in which case we want to serve our "NotFound" error page
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/foo/bar/baz
Accept: text/html
HTTP 404
[Asserts]
xpath "normalize-space(//head/title)" == "Not Found"

# Test fetching a route as though we are a server or calling fetch() from browser
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/foo/bar/baz
Accept: application/json
HTTP 404

