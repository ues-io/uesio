##################################################################
# Tests object and field level security enforcement OWNER field
##################################################################

# Log into the studio as ben
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}
HTTP 200

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

# Add an impersonation record to use the rep profile
POST https://{{host}}:{{port}}/site/bots/call/uesio/studio/setworkspaceuser
{
    "workspaceid": "{{workspace_id}}",
    "profile": "uesio/tests.rep"
}
HTTP 200

# It is possible to change the owner field of an unprotected collection.
# Pss. OWNER field it's auto populated on creation, you still need the access.
# We SHOULD be able to CREATE tool records
# because ben user impersoning with rep profile have permission to create them
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
[Options]
variable: brand="brand_{{unix_epoch_seconds}}"
variable: category="category_{{unix_epoch_seconds}}"
{
    "wires": [
        {
            "wire": "createtools",
            "collection": "uesio/tests.tool",
            "changes": {
                "1": {
                    "uesio/tests.brand":"{{brand}}",
                    "uesio/tests.category":"{{category}}",
                    "uesio/tests.type":"Drill"
                }
            },
            "upsert": true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
jsonpath "$.wires[0].changes[*]['uesio/core.id']" nth 0 != null

# It is possible to read the owner field of an unprotected collection.
# because ben user impersoning with rep profile DOES have MODIFYALL access to it
# check if the owner is BEN
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.tool",
            "name": "hasModifyAllAccess",
            "fields": [
                {"id":"uesio/core.uniquekey"},
                {"id":"uesio/tests.brand"},
                {"id":"uesio/tests.category"},
                {"id":"uesio/tests.type"},
                {"id":"uesio/core.owner"}
            ],
            "batchsize": 1,
            "query": true,
            "conditions": [
                { "field": "uesio/tests.brand", "operator": "EQ", "value": "{{brand}}" },
                { "field": "uesio/tests.category", "operator": "EQ", "value": "{{category}}" }
            ]
        }
    ]
}
HTTP 200
[Captures]
new_tool_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/tests.category']" == "{{category}}"
jsonpath "$.wires[0].data[0]['uesio/tests.brand']" == "{{brand}}"
jsonpath "$.wires[0].data[0]['uesio/tests.type']" == "Drill"
jsonpath "$.wires[0].data[0]['uesio/core.owner']['uesio/core.uniquekey']" == "ben"

# It is possible to update the owner field of an unprotected collection.
# We should be able to EDIT tool records
# because ben user impersoning with rep profile have permission to edit them
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "updatetool",
            "collection": "uesio/tests.tool",
            "changes": {
                "1": {
                    "uesio/core.id": "{{new_tool_id}}",
                    "uesio/tests.brand": "Makitahhaaaa",
                    "uesio/tests.category": "Power",
                    "uesio/core.owner":{
                            "uesio/core.uniquekey":"abel"
                    }
                }
            },
            "upsert": false
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# It is possible to read the owner field of an unprotected collection.
# because ben user impersoning with rep profile DOES have MODIFYALL access to it
# Make sure the new owner is ABEL
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.tool",
            "name": "hasModifyAllAccess",
            "fields": [
                {"id":"uesio/core.uniquekey"},
                {"id":"uesio/tests.brand"},
                {"id":"uesio/tests.category"},
                {"id":"uesio/tests.type"},
                {"id":"uesio/core.owner"}
            ],
            "batchsize": 1,
            "query": true,
            "conditions": [
                { "field": "uesio/core.id", "operator": "EQ", "value": "{{new_tool_id}}" }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.owner']['uesio/core.uniquekey']" == "abel"


# Add an impersonation record to use the owner_locked profile
POST https://{{host}}:{{port}}/site/bots/call/uesio/studio/setworkspaceuser
{
    "workspaceid": "{{workspace_id}}",
    "profile": "uesio/tests.owner_locked"
}
HTTP 200

# It is possible to read the owner field of an protected collection.
# because ben user impersoning with owner_locked profile DOES have MODIFYALL access to it 
# and read access to the owner field, the owner should still be abel
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.tool",
            "name": "hasModifyAllAccess",
            "fields": [
                {"id":"uesio/core.uniquekey"},
                {"id":"uesio/tests.brand"},
                {"id":"uesio/tests.category"},
                {"id":"uesio/tests.type"},
                {"id":"uesio/core.owner"}
            ],
            "batchsize": 1,
            "query": true,
            "conditions": [
                { "field": "uesio/core.id", "operator": "EQ", "value": "{{new_tool_id}}" }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.owner']['uesio/core.uniquekey']" == "abel"

# It is not possible to update the owner field of an protected collection.
# because ben user impersoning with owner_locked profile do not have permission to edit them
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "updatetool",
            "collection": "uesio/tests.tool",
            "changes": {
                "1": {
                    "uesio/core.id": "{{new_tool_id}}",
                    "uesio/tests.brand": "Makitahhaaaa",
                    "uesio/tests.category": "Power",
                    "uesio/core.owner":{
                            "uesio/core.uniquekey":"ben"
                    }
                }
            },
            "upsert": false
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors[0].message" == "Profile uesio/tests.owner_locked does not have edit access to the uesio/core.owner field."