#########################################
# Tests security on the create bundle bot
#########################################

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Retrieve the tests app and admins team ids
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
{
    "wires": [
        {
            "name": "app",
            "collection": "uesio/studio.app",
            "fields": [
                { "id": "uesio/core.id" },
                { "id": "uesio/core.uniquekey" }
            ],
            "conditions": [
                { "field": "uesio/core.uniquekey", "operator": "EQ", "value": "uesio/tests", "valueSource": "VALUE" }
            ],
            "query": true,
            "requirewriteaccess": true
        },
        {
            "name": "team",
            "collection": "uesio/studio.team",
            "fields": [
                { "id": "uesio/core.id" },
                { "id": "uesio/core.uniquekey" },
                { "id": "uesio/studio.name" }
            ],
            "conditions": [
                { "field": "uesio/studio.name", "operator": "EQ", "value": "admins", "valueSource": "VALUE" },
                { "field": "uesio/studio.app", "lookupWire": "app", "lookupField": "uesio/core.id", "valueSource": "LOOKUP" }
            ],
            "query": true,
            "requirewriteaccess": true
        }
    ]
}
HTTP 200
[Captures]
testsAppId: jsonpath "$.wires[0].data[0]['uesio/core.id']"
adminsTeamId: jsonpath "$.wires[1].data[0]['uesio/core.id']"
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests"
jsonpath "$.wires[1].data[0]['uesio/studio.name']" == "admins"

# Log in as abel, who should NOT have access to create bundles on the tests app
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "abel"
}
HTTP 200
[Captures]
abelId: jsonpath "$.user.id"

# try to create a bundle - should fail
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/createbundle
{
    "type": "patch",
    "description": "THIS SHOULD FAIL",
    "app": "uesio/tests",
    "workspaceName": "dev"
}
HTTP 403
[Asserts]
body == "you do not have permission to create bundles for app uesio/tests\n"

# have abel try to add himself to the admins team
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newTeamMember",
            "collection":"uesio/studio.teammember",
            "changes": {
                "1": {
                    "uesio/studio.app": {
                        "uesio/core.id": "{{testsAppId}}"
                    },
                    "uesio/studio.team": {
                        "uesio/core.id": "{{adminsTeamId}}"
                    },
                    "uesio/studio.member": {
                        "uesio/core.id": "{{abelId}}"
                    }
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" count == 1

# now, as Uesio, grant Abel access to the tests app as a maintainer
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newTeamMember",
            "collection":"uesio/studio.teammember",
            "changes": {
                "1": {
                    "uesio/studio.app": {
                        "uesio/core.id": "{{testsAppId}}"
                    },
                    "uesio/studio.team": {
                        "uesio/core.id": "{{adminsTeamId}}"
                    },
                    "uesio/studio.member": {
                        "uesio/core.id": "{{abelId}}"
                    }
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
[Captures]
newTeamMemberId: jsonpath "$.wires[0].changes['1']['uesio/core.id']"

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "abel"
}
HTTP 200

# now Abel should be able to create a bundle
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/createbundle
{
    "type": "patch",
    "description": "bundle created by abel",
    "app": "uesio/tests",
    "workspaceName": "dev"
}
HTTP 200
[Asserts]
jsonpath "$.params.description" == "bundle created by abel"
jsonpath "$.params.major" >= 0
jsonpath "$.params.minor" >= 0
jsonpath "$.params.patch" >= 2
jsonpath "$.success" == true

# Remove abel from the team
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
{
    "wires": [
        {
            "wire": "DeleteTeamMember",
            "collection":"uesio/studio.teammember",
            "deletes": {
                "1": {
                    "uesio/core.id": "{{newTeamMemberId}}"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null