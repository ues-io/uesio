###################################################################
# Tests creating a collection, fields, and collection cascade delete
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

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
[Options]
# This should be made unique once https://github.com/Orange-OpenSource/hurl/issues/3720 is implemented
variable: collection_name="rare_and_unusual_object"
{
    "wires": [
        {
            "collection":"uesio/studio.collection",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.name":"{{collection_name}}",
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
                    "uesio/studio.collection":"{{app_fullname}}.{{collection_name}}",
                    "uesio/studio.name":"object_name",
                    "uesio/studio.label":"Object Name",
                    "uesio/studio.type":"TEXT"
                },
                "temp2":{
                    "uesio/studio.collection":"{{app_fullname}}.{{collection_name}}",
                    "uesio/studio.name":"estimated_value",
                    "uesio/studio.label":"Estimated Value",
                    "uesio/studio.type":"NUMBER",
                    "uesio/studio.number": {
                        "uesio/studio.decimals":2
                    }
                },
                "temp3":{
                    "uesio/studio.collection":"{{app_fullname}}.{{collection_name}}",
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
                    "uesio/studio.collection":"{{app_fullname}}.{{collection_name}}",
                    "uesio/studio.route":"{{app_fullname}}.simple_wire_load",
                    "uesio/studio.type":"list"
                },
                "temp2":{
                    "uesio/studio.collection":"{{app_fullname}}.{{collection_name}}",
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
                    "uesio/studio.collection":"{{app_fullname}}.{{collection_name}}",
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
                    "value": "{{collection_name}}"
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
                    "value": "{{app_fullname}}.{{collection_name}}"
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
                    "value": "{{app_fullname}}.{{collection_name}}"
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
                    "value": "{{app_fullname}}.{{collection_name}}"
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
jsonpath "$.wires[0].data[0]['uesio/studio.name']" == "{{collection_name}}"
jsonpath "$.wires[0].data[0]['uesio/studio.label']" == "Rare and unusual object"
jsonpath "$.wires[0].data[0]['uesio/studio.plurallabel']" == "Rare and unusual objects"
jsonpath "$.wires[1].data" count == 3
jsonpath "$.wires[1].data[0]['uesio/studio.collection']" == "{{app_fullname}}.{{collection_name}}"
jsonpath "$.wires[1].data[0]['uesio/studio.name']" == "estimated_value"
jsonpath "$.wires[1].data[0]['uesio/studio.label']" == "Estimated Value"
jsonpath "$.wires[1].data[0]['uesio/studio.type']" == "NUMBER"
jsonpath "$.wires[1].data[0]['uesio/studio.number']['uesio/studio.decimals']" == 2
jsonpath "$.wires[1].data[1]['uesio/studio.collection']" == "{{app_fullname}}.{{collection_name}}"
jsonpath "$.wires[1].data[1]['uesio/studio.name']" == "object_name"
jsonpath "$.wires[1].data[1]['uesio/studio.label']" == "Object Name"
jsonpath "$.wires[1].data[1]['uesio/studio.type']" == "TEXT"
jsonpath "$.wires[1].data[2]['uesio/studio.collection']" == "{{app_fullname}}.{{collection_name}}"
jsonpath "$.wires[1].data[2]['uesio/studio.name']" == "reference_field"
jsonpath "$.wires[1].data[2]['uesio/studio.label']" == "Super Cool Reference Field"
jsonpath "$.wires[1].data[2]['uesio/studio.type']" == "REFERENCE"
jsonpath "$.wires[1].data[2]['uesio/studio.reference']['uesio/studio.collection']" == "uesio/tests.animal"
jsonpath "$.wires[2].data" count == 2
jsonpath "$.wires[2].data[*]['uesio/studio.collection']" contains "{{app_fullname}}.{{collection_name}}"
jsonpath "$.wires[2].data[*]['uesio/studio.type']" contains "list"
jsonpath "$.wires[2].data[*]['uesio/studio.type']" contains "list"
jsonpath "$.wires[3].data" count == 1
jsonpath "$.wires[3].data[0]['uesio/studio.collection']" == "{{app_fullname}}.{{collection_name}}"
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

# Capture the record count for collections and related metadata items
# TODO: hurl doesn't support jsonpath length() function so we can't use that on the request that gets all the ids for these same collections
# so we need to use aggregates to get the totals. Once https://github.com/Orange-OpenSource/hurl/issues/3935 is implemented, this separate
# request can be removed in favor of using length() function.
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.collection",
            "name": "collection",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.field",
            "name": "fields",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.routeassignment",
            "name": "routeassignment",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.recordchallengetoken",
            "name": "recordchallengetokens",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires" count == 4
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[1].data" count == 1
jsonpath "$.wires[2].data" count == 1
jsonpath "$.wires[3].data" count == 1
[Captures]
workspace_collection_count: jsonpath "$.wires[0].data[0]['uesio/core.id_count']"
workspace_field_count: jsonpath "$.wires[1].data[0]['uesio/core.id_count']"
workspace_routeassignment_count: jsonpath "$.wires[2].data[0]['uesio/core.id_count']"
workspace_recordchallengetoken_count: jsonpath "$.wires[3].data[0]['uesio/core.id_count']"

# Create a bundle, so that we can create another workspace
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/createbundle
{
    "type": "patch",
    "description": "test delete collection bundle",
    "app": "uesio/tests",
    "workspaceName": "dev"
}
HTTP 200
[Captures]
major: jsonpath "$.params.major"
minor: jsonpath "$.params.minor"
patch: jsonpath "$.params.patch"
[Asserts]
jsonpath "$.success" == true
jsonpath "$.error" == ""
jsonpath "$.params.description" == "test delete collection bundle"

# Create a workspace using that bundle
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
[Options]
# This should be made unique once https://github.com/Orange-OpenSource/hurl/issues/3720 is implemented
variable: dup_workspace_name=dev_duplicate_delete_test
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
                    "uesio/studio.name": "{{dup_workspace_name}}",
                    "uesio/studio.sourcebundle": {
                        "uesio/core.uniquekey": "uesio/tests:{{major}}:{{minor}}:{{patch}}"
                    }
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
jsonpath "$.wires[0].changes['1']['uesio/core.uniquekey']" == "uesio/tests:dev_duplicate_delete_test"
[Captures]
dup_workspace_id: jsonpath "$.wires[0].changes['1']['uesio/core.id']"

# Verify the duplicate workspace was created and has the right number of items
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.collection",
            "name": "collection",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.field",
            "name": "fields",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.routeassignment",
            "name": "routeassignment",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.recordchallengetoken",
            "name": "recordchallengetokens",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.collection",
            "name": "collection",
            "fields": [
                {
                    "id": "uesio/core.id"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.name",
                    "value": "{{collection_name}}"
                }
            ],
            "query":true,            
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        }    
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires" count == 5
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[1].data" count == 1
jsonpath "$.wires[2].data" count == 1
jsonpath "$.wires[3].data" count == 1
jsonpath "$.wires[4].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.id_count']" == {{workspace_collection_count}}
jsonpath "$.wires[1].data[0]['uesio/core.id_count']" == {{workspace_field_count}}
jsonpath "$.wires[2].data[0]['uesio/core.id_count']" == {{workspace_routeassignment_count}}
jsonpath "$.wires[3].data[0]['uesio/core.id_count']" == {{workspace_recordchallengetoken_count}}
[Captures]
dup_collection_id: jsonpath "$.wires[4].data[0]['uesio/core.id']"

# Delete the collection from duplicate workspace
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.collection",
            "deletes":{
                "{{collection_name}}": {
                    "uesio/core.id": "{{dup_collection_id}}"
                }
            },
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
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
                    "field": "uesio/core.id",
                    "value": "{{dup_collection_id}}"
                }
            ],
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
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
                    "value": "{{app_fullname}}.{{collection_name}}"
                },
                {
                    "field": "uesio/studio.workspace",
                    "value": "{{dup_workspace_id}}"
                }
            ],
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
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
                    "value": "{{app_fullname}}.{{collection_name}}"
                },
                {
                    "field": "uesio/studio.workspace",
                    "value": "{{dup_workspace_id}}"
                }
            ],
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
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
                    "value": "{{app_fullname}}.{{collection_name}}"
                },
                {
                    "field": "uesio/studio.workspace",
                    "value": "{{dup_workspace_id}}"
                }
            ],
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires" count == 4
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[1].data[*]" isEmpty
jsonpath "$.wires[2].data[*]" isEmpty
jsonpath "$.wires[3].data[*]" isEmpty

# Delete the duplicate workspace
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.workspace",
            "deletes":{
                "{{collection_name}}": {
                    "uesio/core.id": "{{dup_workspace_id}}"
                }
            },
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            },
            "changes":{},
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Verify duplicate workspace was deleted
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [      
        {
            "collection":"uesio/studio.collection",
            "name": "collection",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.field",
            "name": "fields",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.routeassignment",
            "name": "routeassignment",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.recordchallengetoken",
            "name": "recordchallengetokens",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.workspace",
            "name": "workspace",
            "fields": [
                {
                    "id": "uesio/core.id"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.id",
                    "value": "{{dup_workspace_id}}"
                }
            ],
            "query":true,            
            "params": {
                "workspaceid": "{{dup_workspace_id}}"
            }
        }   
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires" count == 5
jsonpath "$.wires[0].data" isEmpty
jsonpath "$.wires[1].data" isEmpty
jsonpath "$.wires[2].data" isEmpty
jsonpath "$.wires[3].data" isEmpty
jsonpath "$.wires[4].data" isEmpty

# Verify dev workspace did not change
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.collection",
            "name": "collection",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.field",
            "name": "fields",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.routeassignment",
            "name": "routeassignment",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        },
        {
            "collection":"uesio/studio.recordchallengetoken",
            "name": "recordchallengetokens",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/studio.workspace"
                }
            ],            
            "query":true,            
            "aggregate":true,
            "params": {
                "workspaceid": "{{workspace_id}}"
            }
        }  
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires" count == 4
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[1].data" count == 1
jsonpath "$.wires[2].data" count == 1
jsonpath "$.wires[3].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.id_count']" == {{workspace_collection_count}}
jsonpath "$.wires[1].data[0]['uesio/core.id_count']" == {{workspace_field_count}}
jsonpath "$.wires[2].data[0]['uesio/core.id_count']" == {{workspace_routeassignment_count}}
jsonpath "$.wires[3].data[0]['uesio/core.id_count']" == {{workspace_recordchallengetoken_count}}
