POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Delete the test site if it already exists
DELETE https://{{host}}:{{port}}/site/api/v1/collection/uesio/studio/site?uesio/studio.name=eq.testsite
x-uesio-app: uesio/tests
HTTP 204

# Delete the tests app if it already exists, which should cascade delete the workspace and all of its metadata
DELETE https://{{host}}:{{port}}/site/api/v1/collection/uesio/studio/app?uesio/studio.fullname=eq.uesio%2Ftests
HTTP 204

# Verify that workspaces are cascade deleted
POST https://{{host}}:{{port}}/site/wires/load
{
    "wires": [
        {
            "name": "workspaces",
            "collection": "uesio/studio.workspace",
            "conditions": [
                {
                    "field": "uesio/studio.app->uesio/studio.fullname",
                    "operator": "EQ",
                    "value": "uesio/tests"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].data" count == 0

# Create the tests app
POST https://{{host}}:{{port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newapp",
            "collection": "uesio/studio.app",
            "changes": {
                "1": {
                    "uesio/studio.user": {
                        "uesio/core.id": "{{user_id}}",
                        "uesio/core.uniquekey":"uesio"
                    },
                    "uesio/studio.color": "#0e7490",
                    "uesio/studio.icon": "bug_report",
                    "uesio/studio.name": "tests",
                    "uesio/studio.description": "Integration tests"
                }
            },
            "upsert": true
        }
    ]
}
HTTP 200
[Captures]
app_id: jsonpath "$.wires[0].changes['1']['uesio/core.id']"
[Asserts]
jsonpath "$.wires[0].errors" == null

# Create tests team
POST https://{{host}}:{{port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newteam",
            "collection":"uesio/studio.team",
            "changes": {
                "1": {
                    "uesio/studio.app": {
                        "uesio/core.id": "{{app_id}}"
                    },
                    "uesio/studio.name": "admins"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
[Captures]
team_id: jsonpath "$.wires[0].changes['1']['uesio/core.id']"

# Get ben's and Wessel id
POST https://{{host}}:{{port}}/site/wires/load
{
    "wires": [
        {
            "collection": "uesio/core.user",
            "conditions": [
                {
                    "field":"uesio/core.uniquekey",
                    "operator":"IN",
                    "valueSource":"VALUE",
                    "values":[
                        "ben",
                        "wessel"
                    ]
                }
            ],
            "query": true,
            "order":[
                {
                    "field":"uesio/core.uniquekey",
                    "desc":false
                }
            ]
        }
    ]
}
HTTP 200
[Captures]
ben_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"
wessel_id: jsonpath "$.wires[0].data[1]['uesio/core.id']"

# Put ben & wessel on the team
POST https://{{host}}:{{port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newTeamMember",
            "collection":"uesio/studio.teammember",
            "changes": {
                "1": {
                    "uesio/studio.app": {
                        "uesio/core.id": "{{app_id}}"
                    },
                    "uesio/studio.team": {
                        "uesio/core.id": "{{team_id}}"
                    },
                    "uesio/studio.member": {
                        "uesio/core.id": "{{ben_id}}"
                    }
                },
                "2": {
                    "uesio/studio.app": {
                        "uesio/core.id": "{{app_id}}"
                    },
                    "uesio/studio.team": {
                        "uesio/core.id": "{{team_id}}"
                    },
                    "uesio/studio.member": {
                        "uesio/core.id": "{{wessel_id}}"
                    }
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Create dev workspace
POST https://{{host}}:{{port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newworkspace",
            "collection":"uesio/studio.workspace",
            "changes": {
                "1": {
                    "uesio/studio.app": {
                        "uesio/core.id": "{{app_id}}"
                    },
                    "uesio/studio.name": "dev"
                }
            }
        }
    ]
}
HTTP 200
[Captures]
workspace_id: jsonpath "$.wires[0].changes['1']['uesio/core.id']"
[Asserts]
jsonpath "$.wires[0].errors" == null

# Set the google auth source config client id value for the workspace
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues/uesio/core/google_auth_client_id
{
    "value": "A client id"
}
HTTP 200

# Create a sample metadata item within the workspace,
# to verify that when we do a deploy, the value is overridden and the workspace bundle cache is invalidated
POST https://{{host}}:{{port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newView",
            "collection":"uesio/studio.view",
            "changes": {
                "1": {
                    "uesio/studio.name": "cacheinvalidationtest",
                    "uesio/studio.definition": "wires:\ncomponents:\n",
                    "uesio/studio.workspace": {
                        "uesio/core.id": "{{workspace_id}}"
                    }
                }
            },
            "params": {
                "workspacename": "dev",
                "app": "uesio/tests"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
jsonpath "$.wires[0].changes['1']['uesio/core.id']" exists
jsonpath "$.wires[0].changes['1']['uesio/studio.name']" == "cacheinvalidationtest"

# Now, access the deps route for previewing that view,
# so that we force the view to be loaded into the workspace bundle cache
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/cacheinvalidationtest
HTTP 200
[Asserts]
jsonpath "$.dependencies.viewdef[0].definition.wires" == null
jsonpath "$.dependencies.wire" count == 0

# Create truncatetests workspace
POST https://{{host}}:{{port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newworkspace",
            "collection":"uesio/studio.workspace",
            "changes": {
                "1": {
                    "uesio/studio.app": {
                        "uesio/core.id": "{{app_id}}"
                    },
                    "uesio/studio.name": "truncatetests"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null