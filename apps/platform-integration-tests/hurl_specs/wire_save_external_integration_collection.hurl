######################################################
# Tests saving an external integration collection
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Test inserting, updating, and deleting dummy records
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/tests.weather_forecast",
            "deletes": {
                "some-record-id": {
                    "uesio/core.id": "some-record-id"
                }
            },
            "changes": {
                "new-record": {},
                "existing-record": {
                    "uesio/core.id": "existing-record"
                }
            },
            "wire": "mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['new-record']['uesio/core.id']" exists
jsonpath "$.wires[0].changes['new-record']['uesio/tests.current'].day" exists
jsonpath "$.wires[0].changes['new-record']['uesio/tests.current'].low" >= 20
jsonpath "$.wires[0].changes['new-record']['uesio/tests.current'].avg" >= 25
jsonpath "$.wires[0].changes['new-record']['uesio/tests.current'].high" >= 30
jsonpath "$.wires[0].changes['existing-record']['uesio/core.id']" == "existing-record"
jsonpath "$.wires[0].changes['existing-record']['uesio/tests.current'].day" exists
jsonpath "$.wires[0].changes['existing-record']['uesio/tests.current'].low" >= 20
jsonpath "$.wires[0].changes['existing-record']['uesio/tests.current'].avg" >= 25
jsonpath "$.wires[0].changes['existing-record']['uesio/tests.current'].high" >= 30
jsonpath "$.wires[0].errors" == null
