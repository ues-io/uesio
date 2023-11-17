######################################################
# Test Signup
######################################################

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "username": "taylor",
    "password": "CdVfgZFgi7fP2E3*",
    "firstname": "Taylor",
    "lastname": "Swift",
    "email": "abel@ues.io"
}
HTTP 200
[Asserts]
jsonpath "$.redirectRouteName" == "signuplanding"
jsonpath "$.redirectRouteNamespace" ==  "uesio/studio"


# GET the login method from the core collection 
# build the link 
# validate it