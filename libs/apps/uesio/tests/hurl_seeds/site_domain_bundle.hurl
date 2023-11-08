POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Retrieve the tests app id
POST https://{{host}}:{{port}}/site/wires/load
{
    "wires": [
        {
            "wire": "app",
            "collection": "uesio/studio.app",
            "fields": [
                { "id": "uesio/core.id" },
                { "id": "uesio/core.uniquekey" }
            ],
            "conditions": [
                { "field": "uesio/core.uniquekey", "operator": "EQ", "value": "uesio/tests", "valueSource": "VALUE" }
            ],
            "query": true
        }
    ]
}
HTTP 200
[Captures]
app_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# Create a bundle, so that we can create a site
POST https://studio.uesio-dev.com:3000/site/bots/call/uesio/studio/createbundle
{
    "type": "patch",
    "description": "test bundle",
    "app": "uesio/tests",
    "workspacename": "dev"
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

# Set the studio APIs config value for the workspace
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/configvalues/uesio/tests/studio_apis_url
{
    "value": "https://{{host}}:{{port}}/workspace/uesio/tests/dev"
}
HTTP 200

# Set the studio APIs config value for the site
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/configvalues/uesio/tests/studio_apis_url
{
    "value": "https://tests.{{domain}}:{{port}}/site"
}
HTTP 200