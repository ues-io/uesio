POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Delete the test site if it already exists
DELETE https://{{host}}:{{port}}/site/api/v1/collection/uesio/studio/site?uesio/studio.name=eq.testsite
x-uesio-app: uesio/tests
HTTP 204

# Delete the tests app if it already exists, which should cascade delete the workspace and all of its metadata
DELETE https://{{host}}:{{port}}/site/api/v1/collection/uesio/studio/app?uesio/studio.fullname=eq.uesio%2Ftests
HTTP 204

# Verify that workspaces are cascade deleted
POST https://{{host}}:{{port}}/site/wires/load
{
    "wires": [
        {
            "name": "workspaces",
            "collection": "uesio/studio.workspace",
            "conditions": [
                {
                    "field": "uesio/studio.app->uesio/studio.fullname",
                    "operator": "EQ",
                    "value": "uesio/tests"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].data" count == 0

# Verify that sites are cascade deleted
POST https://{{host}}:{{port}}/site/wires/load
{
    "wires": [
        {
            "name": "sites",
            "collection": "uesio/studio.site",
            "conditions": [
                {
                    "field": "uesio/studio.app->uesio/studio.fullname",
                    "operator": "EQ",
                    "value": "uesio/tests"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].data" count == 0
