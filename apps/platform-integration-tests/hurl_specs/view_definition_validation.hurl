###################################################################
# Tests validation of View metadata on save
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Get the dev workspace id so we can test saving a view in a workspace
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

# Create a view with valid YAML
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
[Options]
# This was previously using {{unix_epoch_seconds}} to create random value, however hurl does not currently have a way
# to randomly generate data that satisfies our validation of letter/digit/underscore only.  For these tests, we do not
# need random data since all of our tests require that the tests-init script be run to create the data before every
# execution anyway.  The benefit of having view_suffix be random is that it would allow this individual file to execute
# on its own without having to re-run tests-init every time, however the way all these tests are written, they don't
# lend themselves to that execution style anyway.  For now, changing to fixed value but could potentially revisit if/when
# hurl extends its built-in function support for random data (see https://github.com/Orange-OpenSource/hurl/issues/3720)
variable: view_suffix="123456789"
{
    "wires": [
        {
            "collection":"uesio/studio.view",
            "deletes": {},
            "changes": {
                "temp1": {
                    "uesio/studio.definition": "  wires:\n    users:\n        collection: uesio/core.user\n        fields:\n            uesio/core.id:\n            uesio/core.firstname:\n            uesio/core.lastname: {}\n        conditions:\n            - field: uesio/core.firstname\n              value: Sally\n            - field: uesio/core.lastname\n              valueSource: VALUE\n              operator: NOT_EQ\n              value: Jones\n        batchsize: 100\n  components:\n",
                    "uesio/studio.name": "validyamlview_{{view_suffix}}"
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.view",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.definition": "wires:\n  users:\n    collectio: uesio/core.user\n    fields:\n      uesio/core.id:\n      uesio/core.firstname:\n      uesio/core.lastname: {}\n    batchsize: this is not a valid number\ncomponents:\n",
                    "uesio/studio.name":"invalidyamlview_{{view_suffix}}"
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
jsonpath "$.wires[0].errors[0].message" contains "Field 'Definition' failed YAML schema validation: [1] wires.users.batchsize: Invalid type. Expected: number, given: string [2] wires.users: Additional property collectio is not allowed [3] wires.users: collection is required"

# Create a view with a valid ViewOnly wire
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.view",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.definition": "wires:\n  users:\n    viewOnly: true\n    fields:\n      foo:\n        type: NUMBER\n        label: Foo\n        number:\n          decimals: 2\ncomponents:\n",
                    "uesio/studio.name":"viewonlywiretest_{{view_suffix}}"
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.view",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.definition": "wires:\n  users:\n    viewOnly: true\n    fields:\n      foo:\n        type: BAR\n        required: no\n        number:\n          some: thing\ncomponents:\n",
                    "uesio/studio.name":"invalidviewonlywire_{{view_suffix}}"
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
jsonpath "$.wires[0].errors[0].message" == `Field 'Definition' failed YAML schema validation: [1] wires.users.fields.foo.number: Additional property some is not allowed [2] wires.users.fields.foo.number: decimals is required [3] wires.users.fields.foo.required: Invalid type. Expected: boolean, given: string [4] wires.users.fields.foo.type: wires.users.fields.foo.type must be one of the following: "AUTONUMBER", "CHECKBOX", "DATE", "EMAIL", "FILE", "LIST", "LONGTEXT", "MAP", "METADATA", "MULTIMETADATA", "MULTISELECT", "NUMBER", "REFERENCE", "REFERENCEGROUP", "SELECT", "STRUCT", "TEXT", "TIMESTAMP", "USER", "ANY"`

