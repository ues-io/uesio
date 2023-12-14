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
HTTP 403
[Asserts]
body == "Metadata item: uesio/core.secretstorevalue is not public\n"

# Invoke a bot that runs an integration action that fetches a secret which we SHOULD have access to
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/secret_access_tester
{
    "integrationName": "uesio/tests.secret_access_allowed",
    "actionName": "get_secret"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.params.secretValue" == "this-is-my-key"

# Invoke a bot that runs an integration action that fetches a secret which we SHOULD NOT have access to
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/secret_access_tester
{
    "integrationName": "uesio/tests.secret_access_forbidden",
    "actionName": "get_secret"
}
HTTP 500 # TODO This really should be a 403 error... need to improve Bot error handling!!!
