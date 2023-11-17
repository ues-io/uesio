######################################################
# Test Signup
######################################################

POST https://{{host}}:{{port}}/site/auth/uesio/studio/platform/signup
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

#Login as Ben, since ben has permission to administer the Studio site (uesio does not)
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}

# GET the login method from the core collection, this has the CODE to validate the user
POST https://{{host}}:{{port}}/siteadmin/uesio/studio/prod/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.loginmethod",
            "query":true,
            "fields": [
                {
                    "id": "uesio/core.federation_id"
                },
                {
                    "id": "uesio/core.verification_code"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.federation_id",
                    "value": "taylor"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.federation_id']" == "taylor"
jsonpath "$.wires[0].data" count == 1
[Captures]
verification_code: jsonpath "$.wires[0].data[0]['uesio/core.verification_code']"

# build the link & verify the user
GET https://{{host}}:{{port}}/site/auth/uesio/studio/platform/signup/confirm?code={{verification_code}}&username=taylor
HTTP 302

# try to login as Taylor Swift
POST https://{{host}}:{{port}}/site/auth/uesio/core/platform/login
{
    "username": "taylor",
    "password": "CdVfgZFgi7fP2E3*"
}
HTTP 200
[Asserts]
jsonpath "$.redirectRouteName" == "home"
jsonpath "$.redirectRouteNamespace" ==  "uesio/studio"
jsonpath "$.user.firstname" ==  "Taylor"
jsonpath "$.user.lastname" ==  "Swift"