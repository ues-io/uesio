POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Delete the test site if it already exists
DELETE https://{{host}}:{{port}}/site/api/v1/collection/uesio/studio/site?uesio/studio.name=eq.testsite
HTTP 204

# Delete the tests app if it already exists, which should cascade delete the workspace and all of its data
DELETE https://{{host}}:{{port}}/site/api/v1/collection/uesio/studio/app?uesio/studio.fullname=eq.uesio%2Ftests
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

# Create a bundle, so that we can create a site
POST https://studio.uesio-dev.com:3000/workspace/uesio/tests/dev/bots/call/uesio/studio/createbundle
{
    "type": "patch",
    "description": "test bundle"
}
HTTP 200
[Captures]
major: jsonpath "$.params.major"
minor: jsonpath "$.params.minor"
patch: jsonpath "$.params.patch"
[Asserts]
jsonpath "$.success" == true
jsonpath "$.error" == ""
jsonpath "$.params.description" == "test bundle"

# Create a site using that bundle
POST https://{{host}}:{{port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newsite",
            "collection": "uesio/studio.site",
            "changes": {
                "1": {
                    "uesio/studio.app": {
                        "uesio/core.id": "{{app_id}}"
                    },
                    "uesio/studio.name": "testsite",
                    "uesio/studio.bundle": {
                        "uesio/core.uniquekey": "uesio/tests:{{major}}:{{minor}}:{{patch}}"
                    }
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['1']['uesio/core.uniquekey']" == "uesio/tests:testsite"

# Create a site domain, so that we can test accessing the site
POST https://{{host}}:{{port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newdomain",
            "collection":"uesio/studio.sitedomain",
            "changes": {
                "1": {
                    "uesio/studio.domain": "tests",
                    "uesio/studio.type": "subdomain",
                    "uesio/studio.site": {
                        "uesio/core.uniquekey": "uesio/tests:testsite"
                    }
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['1']['uesio/core.uniquekey']" == "tests:subdomain"
jsonpath "$.wires[0].errors" == null