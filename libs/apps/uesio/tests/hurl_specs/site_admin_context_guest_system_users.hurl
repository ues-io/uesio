# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}


#Get System user ID from the Uniquekey
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.user",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "system"
                }
            ]
        }
    ]
}
HTTP 200
[Captures]
system_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"


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
jsonpath "$.wires[0].errors[0].message" == "user system can't be delete"

#Get guest user ID from the Uniquekey
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.user",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "guest"
                }
            ]
        }
    ]
}
HTTP 200
[Captures]
guest_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"


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
jsonpath "$.wires[0].errors[0].message" == "user guest can't be delete"