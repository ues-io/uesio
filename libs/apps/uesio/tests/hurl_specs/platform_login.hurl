########################
# Tests platform login
########################

# Try to login without providing username
POST https://{{host}}:{{port}}/site/auth/uesio/core/platform/login
{}
HTTP 400
[Asserts]
body == "You must enter a username\n"

# Try to login without providing password
POST https://{{host}}:{{port}}/site/auth/uesio/core/platform/login
{
    "username": "uesio"
}
HTTP 400
[Asserts]
body == "You must enter a password\n"
