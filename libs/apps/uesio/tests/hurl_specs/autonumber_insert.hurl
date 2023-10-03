######################################################
# Tests loading a wire
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test a simple insert for the default autonumber
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/tests.species":"Pokemon",
                    "uesio/tests.genus":"Po"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/tests.species']" == "Pokemon"
jsonpath "$.wires[0].changes['temp1']['uesio/tests.genus']" == "Po"
jsonpath "$.wires[0].changes['temp1']['uesio/core.id']" matches /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
jsonpath "$.wires[0].errors" == null
[Captures]
newid: jsonpath "$.wires[0].changes[*]['uesio/core.id']" nth 0

# Now see if the insert worked
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "fields": [
                {
                    "id": "uesio/tests.genus"
                },
                {
                    "id": "uesio/tests.species"
                },
                {
                    "id": "uesio/tests.autonumber"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.id",
                    "value": "{{newid}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.genus']" == "Po"
jsonpath "$.wires[0].data[0]['uesio/tests.species']" == "Pokemon"
jsonpath "$.wires[0].data[0]['uesio/tests.autonumber']" matches /^[0-9]{4,9}$/
