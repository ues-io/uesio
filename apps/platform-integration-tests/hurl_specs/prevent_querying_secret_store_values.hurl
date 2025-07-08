######################################################
# Tests to ensure that the uesio/core.secretstorevalue collection values cannot be queried
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Set the value of the Resend key so that we can test it
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.secret",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/appkit.resend_key",
                    "uesio/core.value":"this-is-my-key"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Test a direct wire load on the collection --- should not be accessible because it is not public
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
                    "value": "uesio/appkit.resend_key"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].errors[0].message" contains "your profile has no access to the uesio/core.secretstorevalue collection"

# Invoke a bot that runs an integration action that fetches a secret which we SHOULD have access to
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/secret_access_tester
{
    "integrationName": "uesio/tests.secret_access_allowed",
    "actionName": "get_secret"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.params.secretValue" == "this-is-my-key"

# Invoke a bot that runs an integration action that fetches a secret which we SHOULD NOT have access to
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/tests/secret_access_tester
{
    "integrationName": "uesio/tests.secret_access_forbidden",
    "actionName": "get_secret"
}
HTTP 400 # TODO This really should be a 403 error... need to improve Bot error handling!!!
[Asserts]
body contains "GoError: could not retrieve Credentials with name uesio/tests.secret_access_forbidden for Integration uesio/tests.secret_access_forbidden"
