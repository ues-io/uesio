######################################################
# Tests saving a wire with reference fields
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}


# GET an account and contact uuid
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.name",
                    "value": "Acme Widgets Inc"
                }
            ],
            "batchsize":1
        },
        {
            "collection":"uesio/tests.contact",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.firstname",
                    "value": "George"
                }
            ],
            "batchsize":1
        }
    ]
}
HTTP 200
[Captures]
ACC-UUID: jsonpath "$.wires[0].data[0]['uesio/core.id']"
CON-UUID: jsonpath "$.wires[1].data[0]['uesio/core.id']"

# update the contact to have the account
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.contact",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id": "{{CON-UUID}}",
                    "uesio/tests.account": {
                        "uesio/core.id": "{{ACC-UUID}}",
                        "uesio/tests.description": "Silly Account Description"
                    }
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/tests.account']['uesio/core.id']" == "{{ACC-UUID}}"
# Verify that fields were not removed from changes on the account
jsonpath "$.wires[0].changes['temp1']['uesio/tests.account']['uesio/tests.description']" == "Silly Account Description"
jsonpath "$.wires[0].errors" == null

