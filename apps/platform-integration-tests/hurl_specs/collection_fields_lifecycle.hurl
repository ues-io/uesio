###################################################################
# Tests creating a collection, fields, and collection cascade delete
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Get the dev workspace id so we can test saving collections/fields
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

# Create a collection
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.collection",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.name":"rare_and_unusual_object",
                    "uesio/studio.label":"Rare and unusual object",
                    "uesio/studio.plurallabel":"Rare and unusual objects"
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

# Create fields associated with the collection
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.field",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.collection":"{{app_fullname}}.rare_and_unusual_object",
                    "uesio/studio.name":"object_name",
                    "uesio/studio.label":"Object Name",
                    "uesio/studio.type":"TEXT"
                },
                "temp2":{
                    "uesio/studio.collection":"{{app_fullname}}.rare_and_unusual_object",
                    "uesio/studio.name":"estimated_value",
                    "uesio/studio.label":"Estimated Value",
                    "uesio/studio.type":"NUMBER",
                    "uesio/studio.number": {
                        "uesio/studio.decimals":2
                    }
                },
                "temp3":{
                    "uesio/studio.collection":"{{app_fullname}}.rare_and_unusual_object",
                    "uesio/studio.name":"reference_field",
                    "uesio/studio.label":"Reference Field",
                    "uesio/studio.type":"REFERENCE",
                    "uesio/studio.reference": {
                        "uesio/studio.collection":"uesio/tests.animal"
                    }
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
jsonpath "$.wires[0].changes['temp2']['uesio/studio.number']['uesio/studio.decimals']" == 2
[Captures]
field_id: jsonpath "$.wires[0].changes['temp3']['uesio/core.id']"

# Make an update to the reference field
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.field",
            "deletes":{},
            "changes":{
                "temp3":{
                    "uesio/core.id":"{{field_id}}",
                    "uesio/studio.label":"Super Cool Reference Field"
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

# Create a route assignment associated with the collection
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.routeassignment",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.collection":"{{app_fullname}}.rare_and_unusual_object",
                    "uesio/studio.route":"{{app_fullname}}.simple_wire_load",
                    "uesio/studio.type":"list"
                },
                "temp2":{
                    "uesio/studio.collection":"{{app_fullname}}.rare_and_unusual_object",
                    "uesio/studio.route":"{{app_fullname}}.dependencies_group",
                    "uesio/studio.type":"detail"
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

# Create a record challenge token associated with the collection
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.recordchallengetoken",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.collection":"{{app_fullname}}.rare_and_unusual_object",
                    "uesio/studio.name":"sometoken",
                    "uesio/studio.access":"read"
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

# Verify the collection and related entities were saved successfully
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "includeMetadata": true,
    "wires": [
        {
            "collection":"uesio/studio.collection",
            "name": "collection",
            "query":true,
            "fields": [
                {
                    "id": "uesio/studio.name"
                },
                {
                    "id": "uesio/studio.label"
                },
                {
                    "id": "uesio/studio.plurallabel"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.name",
                    "value": "rare_and_unusual_object"
                }
            ],
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.field",
            "name": "fields",
            "query":true,
            "fields": [
                {
                    "id": "uesio/studio.name"
                },
                {
                    "id": "uesio/studio.label"
                },
                {
                    "id": "uesio/studio.type"
                },
                {
                    "id": "uesio/studio.collection"
                },
                {
                    "id": "uesio/studio.number"
                },
                {
                    "id": "uesio/studio.reference"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.collection",
                    "value": "{{app_fullname}}.rare_and_unusual_object"
                }
            ],
            "order": [
                {
                    "field": "uesio/studio.name",
                    "direction": "ASC"
                }
            ],
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.routeassignment",
            "name": "fields",
            "query":true,
            "fields": [
                {
                    "id": "uesio/studio.route"
                },
                {
                    "id": "uesio/studio.type"
                },
                {
                    "id": "uesio/studio.collection"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.collection",
                    "value": "{{app_fullname}}.rare_and_unusual_object"
                }
            ],
            "order": [
                {
                    "field": "uesio/studio.type",
                    "direction": "ASC"
                }
            ],
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.recordchallengetoken",
            "name": "recordchallengetokens",
            "query":true,
            "fields": [
                {
                    "id": "uesio/studio.name"
                },
                {
                    "id": "uesio/studio.access"
                },
                {
                    "id": "uesio/studio.collection"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.collection",
                    "value": "{{app_fullname}}.rare_and_unusual_object"
                }
            ],
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/studio.name']" == "rare_and_unusual_object"
jsonpath "$.wires[0].data[0]['uesio/studio.label']" == "Rare and unusual object"
jsonpath "$.wires[0].data[0]['uesio/studio.plurallabel']" == "Rare and unusual objects"
jsonpath "$.wires[1].data" count == 3
jsonpath "$.wires[1].data[0]['uesio/studio.collection']" == "{{app_fullname}}.rare_and_unusual_object"
jsonpath "$.wires[1].data[0]['uesio/studio.name']" == "estimated_value"
jsonpath "$.wires[1].data[0]['uesio/studio.label']" == "Estimated Value"
jsonpath "$.wires[1].data[0]['uesio/studio.type']" == "NUMBER"
jsonpath "$.wires[1].data[0]['uesio/studio.number']['uesio/studio.decimals']" == 2
jsonpath "$.wires[1].data[1]['uesio/studio.collection']" == "{{app_fullname}}.rare_and_unusual_object"
jsonpath "$.wires[1].data[1]['uesio/studio.name']" == "object_name"
jsonpath "$.wires[1].data[1]['uesio/studio.label']" == "Object Name"
jsonpath "$.wires[1].data[1]['uesio/studio.type']" == "TEXT"
jsonpath "$.wires[1].data[2]['uesio/studio.collection']" == "{{app_fullname}}.rare_and_unusual_object"
jsonpath "$.wires[1].data[2]['uesio/studio.name']" == "reference_field"
jsonpath "$.wires[1].data[2]['uesio/studio.label']" == "Super Cool Reference Field"
jsonpath "$.wires[1].data[2]['uesio/studio.type']" == "REFERENCE"
jsonpath "$.wires[1].data[2]['uesio/studio.reference']['uesio/studio.collection']" == "uesio/tests.animal"
jsonpath "$.wires[2].data" count == 2
jsonpath "$.wires[2].data[*]['uesio/studio.collection']" contains "{{app_fullname}}.rare_and_unusual_object"
jsonpath "$.wires[2].data[*]['uesio/studio.type']" contains "list"
jsonpath "$.wires[2].data[*]['uesio/studio.type']" contains "list"
jsonpath "$.wires[3].data" count == 1
jsonpath "$.wires[3].data[0]['uesio/studio.collection']" == "{{app_fullname}}.rare_and_unusual_object"
jsonpath "$.wires[3].data[0]['uesio/studio.access']" == "read"
jsonpath "$.wires[3].data[0]['uesio/studio.name']" == "sometoken"
# TODO This should really be 4 but we are loading too many collections server-side
jsonpath "$.collections[*].name" count <= 11
jsonpath "$.collections['uesio/studio.collection'].name" == "collection"
jsonpath "$.collections['uesio/studio.recordchallengetoken'].name" == "recordchallengetoken"
jsonpath "$.collections['uesio/studio.routeassignment'].name" == "routeassignment"
jsonpath "$.collections['uesio/studio.field'].name" == "field"
[Captures]
collection_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# Test the studio recentmetadata collection
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.recentmetadata",
            "name": "recentmetadata",
            "query": true,
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count >= 1
jsonpath "$.wires[0].data[*]['uesio/studio.name']" != ""
jsonpath "$.wires[0].data[*]['uesio/studio.label']" != ""

# Delete the collection
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.collection",
            "deletes":{
                "{{collection_id}}": {
                    "uesio/core.id": "{{collection_id}}"
                }
            },
            "params": {
                "workspaceid": "{{workspace_id}}"
            },
            "changes":{},
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Verify that the collection, and its dependencies, were deleted successfully
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.collection",
            "query":true,
            "fields": [
                {
                    "id": "uesio/core.id"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.name",
                    "value": "rare_and_unusual_object"
                },
                {
                    "field": "uesio/studio.workspace",
                    "value": "{{workspace_id}}"
                }
            ],
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.field",
            "query":true,
            "fields": [
                {
                    "id": "uesio/core.id"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.collection",
                    "value": "{{app_fullname}}.rare_and_unusual_object"
                },
                {
                    "field": "uesio/studio.workspace",
                    "value": "{{workspace_id}}"
                }
            ],
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.routeassignment",
            "query":true,
            "fields": [
                {
                    "id": "uesio/core.id"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.collection",
                    "value": "{{app_fullname}}.rare_and_unusual_object"
                },
                {
                    "field": "uesio/studio.workspace",
                    "value": "{{workspace_id}}"
                }
            ],
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.recordchallengetoken",
            "query":true,
            "fields": [
                {
                    "id": "uesio/core.id"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.collection",
                    "value": "{{app_fullname}}.rare_and_unusual_object"
                },
                {
                    "field": "uesio/studio.workspace",
                    "value": "{{workspace_id}}"
                }
            ],
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[1].data[*]" isEmpty
jsonpath "$.wires[2].data[*]" isEmpty
jsonpath "$.wires[3].data[*]" isEmpty
