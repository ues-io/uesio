######################################################
# Tests Uniquekey
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test a simple insert into the bundle collection
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.bundle",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/tests.major": 0.000005,
                    "uesio/tests.minor": 0,
                    "uesio/tests.patch": 1
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/tests.major']" == 0.000005
jsonpath "$.wires[0].changes['temp1']['uesio/tests.minor']" == 0
jsonpath "$.wires[0].changes['temp1']['uesio/tests.patch']" == 1
jsonpath "$.wires[0].errors" == null
[Captures]
newid: jsonpath "$.wires[0].changes[*]['uesio/core.id']" nth 0

# Now see if the insert worked
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.bundle",
            "query":true,
            "fields": [
                {
                    "id": "uesio/tests.major"
                },
                {
                    "id": "uesio/tests.minor"
                },
                {
                    "id": "uesio/tests.patch"
                },
                {
                    "id": "uesio/core.uniquekey"
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
jsonpath "$.wires[0].data[0]['uesio/tests.major']" == 0.000005
jsonpath "$.wires[0].data[0]['uesio/tests.minor']" == 0
jsonpath "$.wires[0].data[0]['uesio/tests.patch']" == 1
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "0:0:1"