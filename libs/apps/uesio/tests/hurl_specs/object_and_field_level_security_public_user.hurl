######################################################
# Tests object and field level security enforcement
# on wire loads, for a public user
######################################################

# Object level security -- we should NOT be able to query wire_condition
# because the public profile has no access to it
POST https://tests.{{domain}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "name": "noAccess",
            "fields": [
                {"id":"uesio/core.uniquekey"},
                {"id":"uesio/tests.name"}
            ],
            "query": true
        }
    ]
}
HTTP 403
[Asserts]
body contains "Profile uesio/tests.public does not have read access to the uesio/tests.wire_condition collection."

# Object level security -- we SHOULD be able to query the animal collection
# because the public profile DOES have access to it
POST https://tests.{{domain}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "name": "hasAccess",
            "fields": [
                {"id":"uesio/core.uniquekey"},
                {"id":"uesio/tests.genus"},
                {"id":"uesio/tests.species"}
            ],
            "batchsize": 1,
            "query": true,
            "conditions": [
                { "field": "uesio/tests.genus", "operator": "EQ", "value": "Mouton" }
            ]
        }
    ]
}
HTTP 200
[Captures]
animal_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/tests.species']" == "Abrahan"

# Object security in routes - we SHOULD be able to query the animal collection via a route load
# for a route with a wire on our requested collection
GET https://tests.{{domain}}:{{port}}/site/routes/path/uesio/tests/publicanimalslist
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.dependencies.wire[*].data[0]['uesio/tests.species']" nth 0 == "Abrahan"
jsonpath "$.dependencies.wire[*].data[0]['uesio/tests.genus']" nth 0 == "Mouton"
jsonpath "$.dependencies.wire[*]['debugQueryString']" nth 0 == ```
SELECT
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey,
'uesio/tests.genus',main.fields->'uesio/tests.genus',
'uesio/tests.species',main.fields->'uesio/tests.species'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.fields->>'uesio/tests.genus' = $3
LIMIT 3```

# Object level security -- SAVE -- EDIT
# We should NOT be able to EDIT animal records
# because the public profile does not have permission to edit them
POST https://tests.{{domain}}:{{port}}/site/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "updateanimals",
            "collection": "uesio/tests.animal",
            "changes": {
                "1": {
                    "uesio/core.id": "{{animal_id}}",
                    "uesio/tests.genus": "Mouton",
                    "uesio/tests.species": "Abrahan",
                    "uesio/tests.total_population": 1
                }
            },
            "upsert": false
        }
    ]
}
HTTP 403
[Asserts]
body contains "Profile uesio/tests.public does not have edit access to the uesio/tests.animal collection."

# Object level security -- SAVE -- DELETE
# We should NOT be able to DELETE animal records
# because the public profile does not have permission to delete them
POST https://tests.{{domain}}:{{port}}/site/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "deleteanimals",
            "collection": "uesio/tests.animal",
            "deletes": {
                "1": {
                    "uesio/core.id": "{{animal_id}}"
                }
            }
        }
    ]
}
HTTP 403
[Asserts]
body contains "Profile uesio/tests.public does not have delete access to the uesio/tests.animal collection."

# Object level security -- SAVE -- CREATE
# We SHOULD be able to CREATE animal records
# because the public profile DOES have permission to create them
POST https://tests.{{domain}}:{{port}}/site/wires/save
[Options]
variable: genus="Choloepus {{unix_epoch_seconds}}"
variable: species="Didactylus {{unix_epoch_seconds}}"
{
    "wires": [
        {
            "wire": "createanimals",
            "collection": "uesio/tests.animal",
            "changes": {
                "1": {
                    "uesio/tests.genus": "{{genus}}",
                    "uesio/tests.species": "{{species}}"
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
jsonpath "$.wires[0].changes[*]['uesio/core.uniquekey']" nth 0 == "{{genus}}:{{species}}"

# Object level security -- SAVE -- CREATE
# We should NOT be able to CREATE wire_condition records
# because the public profile does not have permission to create them
POST https://tests.{{domain}}:{{port}}/site/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "create_wire_conditions",
            "collection": "uesio/tests.wire_condition",
            "changes": {
                "1": {
                    "uesio/tests.name": "some name"
                }
            },
            "upsert": false
        }
    ]
}
HTTP 403
[Asserts]
body contains "Profile uesio/tests.public does not have create access to the uesio/tests.wire_condition collection."

# FIELD level security -- SAVE -- CREATE
# We should NOT be able to CREATE animal records
# if we are populating fields which we do not have access to
POST https://tests.{{domain}}:{{port}}/site/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "create_animals_with_forbidden_fields",
            "collection": "uesio/tests.animal",
            "changes": {
                "1": {
                    "uesio/tests.genus": "Not relevant",
                    "uesio/tests.species": "Ignored",
                    "uesio/tests.total_population": 100,
                    "uesio/tests.status": "FORBIDDEN FIELD"
                }
            },
            "upsert": false
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors[0].message" == "Profile uesio/tests.public does not have edit access to the uesio/tests.status field."

# Object level security -- we SHOULD be able to query the tool collection
# because the public profile DOES have VIEWALL access to it
POST https://tests.{{domain}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.tool",
            "name": "hasViewAllAccess",
            "fields": [
                {"id":"uesio/core.uniquekey"},
                {"id":"uesio/tests.brand"},
                {"id":"uesio/tests.category"}
            ],
            "batchsize": 1,
            "query": true,
            "conditions": [
                { "field": "uesio/tests.brand", "operator": "EQ", "value": "Skil" }
            ]
        }
    ]
}
HTTP 200
[Captures]
tool_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/tests.category']" == "Power"

# Object level security -- SAVE -- EDIT -- MODIFYALL
# We should NOT be able to EDIT tool records
# because the public profile does not have permission to edit them
POST https://tests.{{domain}}:{{port}}/site/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "updatetool",
            "collection": "uesio/tests.tool",
            "changes": {
                "1": {
                    "uesio/core.id": "{{tool_id}}",
                    "uesio/tests.brand": "Makita",
                    "uesio/tests.category": "Power"
                }
            },
            "upsert": false
        }
    ]
}
HTTP 403
[Asserts]
body contains "Profile uesio/tests.public does not have edit access to the uesio/tests.tool collection."

# Object level security -- SAVE -- DELETE -- MODIFYALL
# We should NOT be able to DELETE tool records
# because the public profile does not have permission to delete them
POST https://tests.{{domain}}:{{port}}/site/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "deletetools",
            "collection": "uesio/tests.tool",
            "deletes": {
                "1": {
                    "uesio/core.id": "{{tool_id}}"
                }
            }
        }
    ]
}
HTTP 403
[Asserts]
body contains "Profile uesio/tests.public does not have delete access to the uesio/tests.tool collection."

# Object level security -- SAVE -- CREATE
# We SHOULD NOT be able to CREATE tool records
# because the public profile DOES NOT have permission to create them
POST https://tests.{{domain}}:{{port}}/site/wires/save
[Options]
variable: brand="brand {{unix_epoch_seconds}}"
variable: category="category {{unix_epoch_seconds}}"
{
    "wires": [
        {
            "wire": "createtools",
            "collection": "uesio/tests.tool",
            "changes": {
                "1": {
                    "uesio/tests.brand": "{{brand}}",
                    "uesio/tests.category": "{{category}}"
                }
            },
            "upsert": true
        }
    ]
}
HTTP 403
[Asserts]
body contains "Profile uesio/tests.public does not have create access to the uesio/tests.tool collection."

# Log into the studio as uesio
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200
[Captures]
uesio_user_id: jsonpath "$.user.id"

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

# Log into the studio as ben
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}
HTTP 200

# Add an impersonation record to use the rep profile
POST https://{{host}}:{{port}}/site/bots/call/uesio/studio/setworkspaceuser
{
    "workspaceid": "{{workspace_id}}",
    "profile": "uesio/tests.rep"
}
HTTP 200

# Object level security -- SAVE -- CREATE
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

# Object level security -- we SHOULD be able to query the tool collection
# because ben user impersoning with rep profile DOES have MODIFYALL access to it
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
                {"id":"uesio/tests.type"}
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

# Object level security -- SAVE -- EDIT -- MODIFYALL
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
                    "uesio/tests.category": "Power"
                }
            },
            "upsert": false
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Object level security -- SAVE -- DELETE -- MODIFYALL
# We should be able to DELETE tool records
# because ben user impersoning with rep profile have permission to delete them
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Content-Type: application/json
{
    "wires": [
        {
            "wire": "deletetools",
            "collection": "uesio/tests.tool",
            "deletes": {
                "1": {
                    "uesio/core.id": "{{new_tool_id}}"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Remove impersonation record to reset to orignal state
POST https://{{host}}:{{port}}/site/bots/call/uesio/studio/setworkspaceuser
{
    "workspaceid": "{{workspace_id}}",
    "profile": ""
}
HTTP 200

