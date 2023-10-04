######################################################
# Tests to ensure that the uesio/core.secretstorevalue collection values cannot be queried
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Set the value of the SendGrid key so that we can test it
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/secrets/uesio/core/sendgridkey
{
    "value": "this-is-my-key"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Test a direct wire load on the collection --- should not be accessible because it is not public
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/core.secretstorevalue",
            "query": true,
            "batchsize": 1,
            "fields": [
                {
                    "id": "uesio/core.value"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.key",
                    "value": "uesio/core.sendgridkey"
                }
            ]
        }
    ]
}
HTTP 400
[Asserts]
body == "Load Failed: metadata: uesio/core.secretstorevalue: Metadata item: uesio/core.secretstorevalue is not public\n"