###################################################################
# Tests validation of View metadata on save
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
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
jsonpath "$.wires[0].data[0]['uesio/studio.fullname']" == "uesio/tests"
jsonpath "$.wires[1].data[0]['uesio/studio.name']" == "dev"
[Captures]
app_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"
app_fullname: jsonpath "$.wires[0].data[0]['uesio/studio.fullname']"
workspace_id: jsonpath "$.wires[1].data[0]['uesio/core.id']"

# Create a view with valid YAML
POST https://{{host}}:{{port}}/site/wires/save
Accept: application/json
[Options]
variable: validyamlview="validyamlview_{{unix_epoch_seconds}}"
{
    "wires": [
        {
            "collection":"uesio/studio.view",
            "deletes": {},
            "changes": {
                "temp1": {
                    "uesio/studio.definition": "wires:\n  users:\n    collection: uesio/core.user\n    fields:\n      uesio/core.id:\n      uesio/core.firstname:\n      uesio/core.lastname: {}\n    batchsize: 100\ncomponents:\n",
                    "uesio/studio.name": "{{validyamlview}}"
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
                    "uesio/studio.name":"invalidyamlview_{{unix_epoch_seconds}}"
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
jsonpath "$.wires[0].errors[0].message" == "Field 'Definition' failed YAML schema validation: [1] wires.users.batchsize: Invalid type. Expected: number, given: string [2] wires.users: Additional property collectio is not allowed [3] wires.users: collection is required"

# Create a view with a valid ViewOnly wire
POST https://{{host}}:{{port}}/site/wires/save
Accept: application/json
[Options]
variable: viewonlywiretest="viewonlywiretest_{{unix_epoch_seconds}}"
{
    "wires": [
        {
            "collection":"uesio/studio.view",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.definition": "wires:\n  users:\n    viewOnly: true\n    fields:\n      foo:\n        type: NUMBER\n        label: Foo\n        number:\n          decimals: 2\ncomponents:\n",
                    "uesio/studio.name":"{{viewonlywiretest}}"
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
jsonpath "$.wires[0].errors" == null

# Create a view with an invalid ViewOnly wire
POST https://{{host}}:{{port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.view",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.definition": "wires:\n  users:\n    viewOnly: true\n    fields:\n      foo:\n        type: BAR\n        required: no\n        number:\n          some: thing\ncomponents:\n",
                    "uesio/studio.name":"invalidviewonlywire_{{unix_epoch_seconds}}"
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
jsonpath "$.wires[0].errors[0].message" == ```Field 'Definition' failed YAML schema validation: [1] wires.users.fields.foo.number: Additional property some is not allowed [2] wires.users.fields.foo.number: decimals is required [3] wires.users.fields.foo.required: Invalid type. Expected: boolean, given: string [4] wires.users.fields.foo.type: wires.users.fields.foo.type must be one of the following: "AUTONUMBER", "CHECKBOX", "DATE", "EMAIL", "FILE", "LIST", "LONGTEXT", "MAP", "METADATA", "MULTIMETADATA", "MULTISELECT", "NUMBER", "REFERENCE", "REFERENCEGROUP", "SELECT", "STRUCT", "TEXT", "TIMESTAMP", "USER"```

