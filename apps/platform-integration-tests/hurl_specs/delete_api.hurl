POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Create an app named tests_delete_api to delete it later
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
[Options]
# This should be made unique once https://github.com/Orange-OpenSource/hurl/issues/3720 is implemented
variable: app_name=tests_int_delete_api
{
    "wires": [
        {
            "wire": "newapp",
            "collection": "uesio/studio.app",
            "changes": {
                "1": {
                    "uesio/studio.user": {
                        "uesio/core.id": "{{user_id}}",
                        "uesio/core.uniquekey":"uesio"
                    },
                    "uesio/studio.color": "#0e7490",
                    "uesio/studio.icon": "bug_report",
                    "uesio/studio.name": "{{app_name}}",
                    "uesio/studio.description": "Delete API tests"
                }
            },
            "upsert": true
        }
    ]
}
HTTP 200
[Captures]
app_id: jsonpath "$.wires[0].changes['1']['uesio/core.id']"
[Asserts]
jsonpath "$.wires[0].errors" == null

# Create a workspace to delete it later
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
[Options]
# This should be made unique once https://github.com/Orange-OpenSource/hurl/issues/3720 is implemented
variable: workspace_name=delete_api_ws
{
    "wires": [
        {
            "wire": "newworkspace",
            "collection": "uesio/studio.workspace",
            "changes": {
                "1": {
                    "uesio/studio.app": {
                        "uesio/core.id": "{{app_id}}"
                    },
                    "uesio/studio.name": "{{workspace_name}}"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
jsonpath "$.wires[0].changes['1']['uesio/core.uniquekey']" == "uesio/{{app_name}}:{{workspace_name}}"

# Delete the workspace that we just created and assert that it was deleted properly 204 (No Content)
DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/api/v1/collection/uesio/studio/workspace?uesio/studio.name=eq.{{workspace_name}}
HTTP 204

# Verify that the workspace got deleted
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
{
    "wires": [
        {
            "name": "workspaces",
            "collection": "uesio/studio.workspace",
            "conditions": [
                {
                    "field": "uesio/studio.name",
                    "operator": "EQ",
                    "value": "uesio/{{workspace_name}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].data" count == 0

# Delete the workspace again and assert that the http status code is 404 (Not Found)
DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/api/v1/collection/uesio/studio/workspace?uesio/studio.name=eq.{{workspace_name}}
HTTP 404

# Delete the app that we created and assert that it was deleted properly 204 (No Content)
DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/api/v1/collection/uesio/studio/app?uesio/studio.name=eq.{{app_name}}
HTTP 204

# Verify that the app got deleted
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
{
    "wires": [
        {
            "name": "apps",
            "collection": "uesio/studio.app",
            "conditions": [
                {
                    "field": "uesio/studio.name",
                    "operator": "EQ",
                    "value": "uesio/{{app_name}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].data" count == 0

# Delete the app again and assert that the http status code is 404 (Not Found)
DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/api/v1/collection/uesio/studio/app?uesio/studio.name=eq.{{app_name}}
HTTP 404