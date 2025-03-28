POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Reset performance stats
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/perf/stats/reset
HTTP 204

# Create the tests app
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/core.google_auth_client_id",
                    "uesio/core.value":"A client id"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Create a sample metadata item within the workspace,
# to verify that when we do a deploy, the value is overridden and the workspace bundle cache is invalidated
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
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
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/cacheinvalidationtest
HTTP 200
[Asserts]
jsonpath "$.dependencies.viewdef[0].definition.wires" == null
jsonpath "$.dependencies.wire" count == 0

# Create truncatetests workspace
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
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
