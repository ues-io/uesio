########################
# Tests platform login
########################

# Try to login without providing username
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/platform/login
{}
HTTP 400
[Asserts]
body contains "You must enter a username"

# Try to login without providing password
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/platform/login
{
    "username": "uesio"
}
HTTP 400
[Asserts]
body contains "You must enter a password"
