# Log into the studio as uesio
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" nth 0 == "uesio/tests:dev"
[Captures]
workspace_id: jsonpath "$.wires[0].data[*]['uesio/core.id']" nth 0


# Workspace users can access everything by default
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
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
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"ben\"}"
}

# Add an impersonation record to use the rep profile
POST https://studio.uesio-dev.com:3000/site/bots/call/uesio/studio/setworkspaceuser
{
    "workspaceid": "{{workspace_id}}",
    "profile": "uesio/tests.rep"
}
HTTP 200

# Now that I'm impersonating with the rep profile, I can't see the evil corp.
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
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
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.accountteammember",
            "query":true
        }
    ]
}
HTTP 400
[Asserts]
body == "Load Failed: Profile uesio/tests.rep does not have read access to the uesio/tests.accountteammember collection.\n"

# Verify that I can still load routes and their dependencies
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/simple_wire_load
HTTP 200
[Asserts]
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].name" == "animals"
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].view" == "uesio/tests.simple_wire_load($root)"
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].batchsize" == 10
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].query" == true
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].batchnumber" == 1
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].more" == true
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].preloaded" == true
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].loadAll" == false
jsonpath "$.dependencies.wire.entities['uesio/tests.simple_wire_load($root):animals'].data[*]['uesio/core.id']" count == 10
