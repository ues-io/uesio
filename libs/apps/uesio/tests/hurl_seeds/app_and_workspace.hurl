POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Delete the dev workspace if it already exists for tests app
DELETE https://{{host}}:{{port}}/site/api/v1/collection/uesio/studio/workspace?uesio/studio.name=eq.dev
HTTP 204

# Delete the tests app if it already exists
DELETE https://{{host}}:{{port}}/site/api/v1/collection/uesio/studio/app?uesio/studio.name=eq.tests
HTTP 204

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
