# Log in as vlad to get his userid
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "vlad"
}
HTTP 200
[Captures]
vlad_user_id: jsonpath "$.user.id"

# Logout as vlad
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/logout
HTTP 200

# Log in as an administrator to create the api key
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Delete all existing api tokens
DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/tests/testsite/api/v1/collection/uesio/core/loginmethod?uesio/core.api_key_name=eq.myapikey
HTTP *
[Asserts]
status toString matches /^(204|404)$/

# Try to create an api token as the owner of the app
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/tests/testsite/bots/call/uesio/core/createapikey
Accept: application/json
{
    "name": "myapikey",
    "userid": "{{vlad_user_id}}"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.params.key" startsWith "ues_"
[Captures]
token: jsonpath "$.params.key"

# Make sure you're just the public user
GET {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/check
HTTP 200
[Asserts]
jsonpath "$.user.username" == "guest"
jsonpath "$.user.profile" == "uesio/tests.public"

# Try log in with a badly formatted token
GET {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/check
Authorization: my_very_bad_token
HTTP 401
[Asserts]
body == "not authorized\n"

# Try log in with a bad token
GET {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/check
Authorization: Bearer my_invalid_token
HTTP 401
[Asserts]
body == "not authorized\n"

# Try to check the auth status as vlad with the token.
GET {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/check
Authorization: Bearer {{token}}
HTTP 200
[Asserts]
jsonpath "$.user.username" == "vlad"
jsonpath "$.user.profile" == "uesio/tests.rep"

# Verify that vlad can see some data with the token
# Vlad cannot see an account that he's not on the team of
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/wires/load
Authorization: Bearer {{token}}
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "batchsize": 1
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1

# Log in as an administrator to delete the api key
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Get the id of the access token login method
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/tests/testsite/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.loginmethod",
            "query":true,
            "conditions": [{
                "field": "uesio/core.api_key_name",
                "value": "myapikey"
            }]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
[Captures]
login_method_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# Try to delte the api token as the owner of the app
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/tests/testsite/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.loginmethod",
            "deletes": {
                "1": {
                    "uesio/core.id": "{{login_method_id}}"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Logout as administrator uesio
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/logout
HTTP 200

# Try to use the token that has now been deleted
GET {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/check
Authorization: Bearer {{token}}
HTTP 401
[Asserts]
body == "not authorized\n"
