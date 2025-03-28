########################
# Tests platform signup
########################

# Try to signup without providing username
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/studio/platform/signup
{}
HTTP 400
[Asserts]
body == "Signup failed - username not provided\n"

# Try to signup with a username that does not match the expected format
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/studio/platform/signup
{
    "username": "....."
}
HTTP 400
[Asserts]
body == "Signup failed - username does not match required pattern: lowercase a-z, 0-9, and underscore only\n"

# TODO: Cannot test anything further without having valid credentials
