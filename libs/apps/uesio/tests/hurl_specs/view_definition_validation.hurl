###################################################################
# Tests validation of View metadata on save
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Get the dev workspace id so we can test saving a view in a workspace
POST https://{{host}}:{{port}}/site/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/studio.fullname']" nth 0 == "uesio/tests"
jsonpath "$.wires[1].data[*]['uesio/studio.name']" nth 0 == "dev"
[Captures]
app_id: jsonpath "$.wires[0].data[*]['uesio/core.id']" nth 0
app_fullname: jsonpath "$.wires[0].data[*]['uesio/studio.fullname']" nth 0
workspace_id: jsonpath "$.wires[1].data[*]['uesio/core.id']" nth 0

# Create a view with valid YAML
POST https://{{host}}:{{port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.view",
            "deletes": {},
            "changes": {
                "temp1": {
                    "uesio/studio.definition": "wires:\n  users:\n    collection: uesio/core.user\n    fields:\n      uesio/core.id:\n      uesio/core.firstname:\n      uesio/core.lastname: {}\n    batchsize: 100\ncomponents:\n",
                    "uesio/studio.name": "validyamlview"
                }
            },
            "params": {
                "workspaceid": "{{workspace_id}}"
            },
            "wire":"mywire",
            "upsert": true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Create a view with invalid YAML
POST https://{{host}}:{{port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.view",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.definition": "wires:\n  users:\n    collectio: uesio/core.user\n    fields:\n      uesio/core.id:\n      uesio/core.firstname:\n      uesio/core.lastname: {}\n    batchsize: this is not a valid number\ncomponents:\n",
                    "uesio/studio.name":"invalidyamlview"
                }
            },
            "params": {
                "workspaceid": "{{workspace_id}}"
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" count == 1
jsonpath "$.wires[0].errors[0].message" == "Field 'Definition' failed YAML schema validation: [1] wires.users: collection is required [2] wires.users: Additional property collectio is not allowed [3] wires.users.batchsize: Invalid type. Expected: number, given: string"
