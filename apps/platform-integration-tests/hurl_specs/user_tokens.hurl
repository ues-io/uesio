# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}


# Test a wire load with no conditions
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.usertokenvalue",
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/studio.name']" includes "uesio.owner"
jsonpath "$.wires[0].data[*]['uesio/studio.name']" includes "uesio.namedpermission"
jsonpath "$.wires[0].data[*]['uesio/studio.name']" includes "uesio.installed"
jsonpath "$.wires[0].data[*]['uesio/studio.token']" includes "uesio/studio.workspace_admin"
jsonpath "$.wires[0].data[*]['uesio/studio.token']" includes "uesio/io"
jsonpath "$.wires[0].data[*]['uesio/studio.token']" includes "uesio/builder"
jsonpath "$.wires[0].data[*]['uesio/studio.token']" includes "uesio/core"

# Test a wire load with a search condition
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.usertokenvalue",
            "query":true,
            "conditions": [
                {
                    "type": "SEARCH",
                    "value": "admin"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/studio.token']" includes "uesio/studio.workspace_admin"
jsonpath "$.wires[0].data[*]['uesio/studio.token']" not includes "uesio/io"
