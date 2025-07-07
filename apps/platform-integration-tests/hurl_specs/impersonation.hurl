# Log into the studio as uesio
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Get the workspace id
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" nth 0 == "uesio/tests:dev"
[Captures]
workspace_id: jsonpath "$.wires[0].data[*]['uesio/core.id']" nth 0


# Workspace users can access everything by default
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Evil Corp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" nth 0 == "Evil Corp"

# Log into the studio as ben
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}
HTTP 200

# Add an impersonation record to use the rep profile
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/setworkspaceuser
{
    "workspaceid": "{{workspace_id}}",
    "profile": "uesio/tests.rep"
}
HTTP 200

# Now that I'm impersonating with the rep profile, I can't see the evil corp.
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Evil Corp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty

# Now that I'm impersonating with the rep profile, I don't have object
# level access to the accountteammeber collection.
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.accountteammember",
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].errors[0].message" contains "Profile uesio/tests.rep does not have read access to the uesio/tests.accountteammember collection."

# Verify that I can still load routes and their dependencies
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/simple_wire_load
HTTP 200
[Asserts]
jsonpath "$.dependencies.wire[0].name" == "animals"
jsonpath "$.dependencies.wire[0].view" == "uesio/tests.simple_wire_load($root)"
jsonpath "$.dependencies.wire[0].batchsize" == 10
jsonpath "$.dependencies.wire[0].query" == true
jsonpath "$.dependencies.wire[0].batchnumber" == 1
jsonpath "$.dependencies.wire[0].more" == true
jsonpath "$.dependencies.wire[0].preloaded" == true
jsonpath "$.dependencies.wire[0].loadAll" == false
jsonpath "$.dependencies.wire[0].data[*]['uesio/core.id']" count == 10

# Switch to impersonating the public profile
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/setworkspaceuser
{
    "workspaceid": "{{workspace_id}}",
    "profile": "uesio/tests.public"
}
HTTP 200

# Now that I'm impersonating with the public profile, I can't load accounts
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Evil Corp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].errors[0].message" contains "Profile uesio/tests.public does not have read access to the uesio/tests.account collection."


# But I should be able to see animal records
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "conditions": [
                {
                    "id": "mycoolid",
                    "field": "uesio/tests.species",
                    "value": "Jerrine"
                }
            ],
            "order": [
                {
                    "field": "uesio/tests.species",
                    "desc": false
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "MacAughtrie:Jerrine"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "McCreary:Jerrine"

# Remove impersonation record to reset to orignal state
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/setworkspaceuser
{
    "workspaceid": "{{workspace_id}}",
    "profile": ""
}
HTTP 200
