######################################################
# Tests create a new bot & delete the related attachments
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Get the workspace id
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.workspace",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "uesio/tests:dev"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests:dev"
[Captures]
workspace_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# Insert a new bot
POST https://{{host}}:{{port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.bot",
            "changes":{
                "temp1":{
                    "uesio/studio.dialect": "TYPESCRIPT",
                    "uesio/studio.name": "kupkerbot",
                    "uesio/studio.type": "LISTENER"
                }
            },
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/studio.dialect']" == "TYPESCRIPT"
jsonpath "$.wires[0].changes['temp1']['uesio/studio.name']" == "kupkerbot"
jsonpath "$.wires[0].changes['temp1']['uesio/studio.workspace']['uesio/core.id']" == "{{workspace_id}}"
jsonpath "$.wires[0].changes['temp1']['uesio/core.id']" matches /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
jsonpath "$.wires[0].errors" == null
[Captures]
newid: jsonpath "$.wires[0].changes[*]['uesio/core.id']" nth 0

# Delete the bot
POST https://{{host}}:{{port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.bot",
            "deletes":{
                "temp1":{
                    "uesio/core.id":"{{newid}}"
                }
            },
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            },
            "changes":{},
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# The bot must not have any attachments.
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.userfile",
            "query":true,
            "fields": [
                {
                    "id": "uesio/core.recordid"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.recordid",
                    "value": "{{newid}}"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 0