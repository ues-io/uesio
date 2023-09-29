###################################################################
# Tests creating a collection, fields, and collection cascade delete
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Get the dev workspace id so we can test saving collections/fields
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

# Create a collection
POST https://{{host}}:{{port}}/site/wires/save
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
POST https://{{host}}:{{port}}/site/wires/save
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
                    "uesio/studio.number->uesio/studio.decimals":2
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
POST https://{{host}}:{{port}}/site/wires/save
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

# Verify the collection and field were saved successfully
POST https://{{host}}:{{port}}/site/wires/load
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
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/studio.name']" == "rare_and_unusual_object"
jsonpath "$.wires[0].data[0]['uesio/studio.label']" == "Rare and unusual object"
jsonpath "$.wires[0].data[0]['uesio/studio.plurallabel']" == "Rare and unusual objects"
jsonpath "$.wires[1].data" count == 2
jsonpath "$.wires[1].data[*]['uesio/studio.collection']" includes "{{app_fullname}}.rare_and_unusual_object"
jsonpath "$.wires[1].data[*]['uesio/studio.name']" includes "estimated_value"
jsonpath "$.wires[1].data[*]['uesio/studio.label']" includes "Object Name"
jsonpath "$.wires[1].data[*]['uesio/studio.type']" includes "NUMBER"
jsonpath "$.wires[2].data" count == 2
jsonpath "$.wires[2].data[*]['uesio/studio.collection']" includes "{{app_fullname}}.rare_and_unusual_object"
jsonpath "$.wires[2].data[*]['uesio/studio.type']" includes "list"
jsonpath "$.wires[2].data[*]['uesio/studio.type']" includes "list"
# TODO This should really be 3 but we are loading too many collections server-side
jsonpath "$.collections[*].name" count <= 10 
jsonpath "$.collections['uesio/studio.collection'].name" == "collection"
jsonpath "$.collections['uesio/studio.routeassignment'].name" == "routeassignment"
jsonpath "$.collections['uesio/studio.field'].name" == "field"
[Captures]
collection_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# Test the studio recentmetadata collection
POST https://{{host}}:{{port}}/site/wires/load
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

# Delete the collection
POST https://{{host}}:{{port}}/site/wires/save
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

# Verify that the collection and fields were deleted successfully
POST https://{{host}}:{{port}}/site/wires/load
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
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[1].data[*]" isEmpty
jsonpath "$.wires[2].data[*]" isEmpty
