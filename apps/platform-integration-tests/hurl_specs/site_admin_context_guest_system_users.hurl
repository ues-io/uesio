# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Create a new user that will be deleted later
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "NewpepeUser",
            "collection": "uesio/core.user",
            "changes": {
                "hU4tDwiR1gMVZ6Oucs7uB": {
                    "uesio/core.type": "PERSON",
                    "uesio/core.username": "pepe",
                    "uesio/core.firstname": "Pepe",
                    "uesio/core.lastname": "delete",
                    "uesio/core.profile": "uesio/tests.public",
                    "uesio/core.email": "pepe@delete.com"
                }
            }
        }
    ]
}
HTTP 200

#Get System user ID from the Uniquekey
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/wires/load
Accept: application/json
{
    "wires":[
        {
            "collection":"uesio/core.user",
            "query":true,
            "conditions":[
                {
                    "field":"uesio/core.uniquekey",
                    "operator":"IN",
                    "values":[
                        "guest",
                        "pepe",
                        "system"
                    ]
                }
            ],
            "order":[
                {
                    "field":"uesio/core.uniquekey",
                    "desc":false
                }
            ]
        }
    ]
}
HTTP 200
[Captures]
guest_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"
pepe_id: jsonpath "$.wires[0].data[1]['uesio/core.id']"
system_id: jsonpath "$.wires[0].data[2]['uesio/core.id']"


# Try to delete system user from the test site as the owner of the app
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "deleteSystemUser",
            "collection": "uesio/core.user",
            "deletes": {
                "1": {
                    "uesio/core.id": "{{system_id}}"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors[0].message" == "user system can't be deleted"

# Try to delete guest user from the test site as the owner of the app
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "deleteGuestUser",
            "collection": "uesio/core.user",
            "deletes": {
                "1": {
                    "uesio/core.id": "{{guest_id}}"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors[0].message" == "user guest can't be deleted"

# Try to delete pepe user from the test site as the owner of the app
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "deletePepeUser",
            "collection": "uesio/core.user",
            "deletes": {
                "1": {
                    "uesio/core.id": "{{pepe_id}}"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
