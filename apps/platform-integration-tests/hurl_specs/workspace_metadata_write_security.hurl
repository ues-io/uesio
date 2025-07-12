###########################################################################
# Tests that saving studio metadata requires write access to the workspace
###########################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Get the dev workspace id so we can test saving metadata as a user without write access
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.app",
            "name": "app",
            "query":true,
            "fields": [
                {
                    "id": "uesio/core.id"
                },
                {
                    "id": "uesio/studio.fullname"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.fullname",
                    "value": "uesio/tests"
                }
            ]
        },
        {
            "collection":"uesio/studio.workspace",
            "name": "workspace",
            "query":true,
            "fields": [
                {
                    "id": "uesio/core.id"
                },
                {
                    "id": "uesio/studio.name"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.name",
                    "value": "dev"
                },
                {
                    "field": "uesio/studio.app",
                    "valueSource": "LOOKUP",
                    "operator": "IN",
                    "lookupWire": "app",
                    "lookupField": "uesio/core.id"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/studio.fullname']" == "uesio/tests"
jsonpath "$.wires[1].data[0]['uesio/studio.name']" == "dev"
[Captures]
app_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"
app_fullname: jsonpath "$.wires[0].data[0]['uesio/studio.fullname']"
workspace_id: jsonpath "$.wires[1].data[0]['uesio/core.id']"

# Login as baxter, who should not have write access to this workspace, and try to modify metadata
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "baxter"
}
HTTP 200

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newView",
            "collection":"uesio/studio.view",
            "changes": {
                "1": {
                    "uesio/studio.name": "baxter_should_not_be_able_to_create_this",
                    "uesio/studio.definition": "wires:\ncomponents:\n"
                }
            },
            "params": {
                "workspaceid": "{{workspace_id}}",
                "app": "{{app_fullname}}"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" count == 1
jsonpath "$.wires[0].errors[0].message" contains "does not exist or you don't have access to modify it"

# Logout
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/logout
HTTP 200

# try as public user to modify workspace metadata
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newView",
            "collection":"uesio/studio.view",
            "changes": {
                "1": {
                    "uesio/studio.name": "baxter_should_not_be_able_to_create_this",
                    "uesio/studio.definition": "wires:\ncomponents:\n"
                }
            },
            "params": {
                "workspaceid": "{{workspace_id}}",
                "app": "{{app_fullname}}"
            }
        }
    ]
}
# TODO: This should be a 403 or a 404 (to obscure) with only an error returned, need to refactor underlying authorization, authentication & session management code.
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" count == 1
jsonpath "$.wires[0].errors[0].message" contains "your profile does not allow you to edit workspace metadata"