######################################################
# Tests Uniquekey
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}
HTTP 200

# Test a simple insert into the bundle collection
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.bundle",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.app": {
                        "uesio/core.uniquekey": "uesio/tests"
                    },
                    "uesio/studio.major": 5.000005,
                    "uesio/studio.minor": 1.6,
                    "uesio/studio.patch": 2
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/studio.major']" == 5
jsonpath "$.wires[0].changes['temp1']['uesio/studio.minor']" == 1
jsonpath "$.wires[0].changes['temp1']['uesio/studio.patch']" == 2
jsonpath "$.wires[0].errors" == null
[Captures]
newid: jsonpath "$.wires[0].changes[*]['uesio/core.id']" nth 0

# Verify that the unique key is built using the metdadata of the number fields
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.bundle",
            "query":true,
            "fields": [
                {
                    "id": "uesio/studio.major"
                },
                {
                    "id": "uesio/studio.minor"
                },
                {
                    "id": "uesio/studio.patch"
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
jsonpath "$.wires[0].data[0]['uesio/studio.major']" == 5
jsonpath "$.wires[0].data[0]['uesio/studio.minor']" == 1
jsonpath "$.wires[0].data[0]['uesio/studio.patch']" == 2
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests:5:1:2"

# Clean up the bundle we just created
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.bundle",
            "deletes":{
                "temp1":{
                    "uesio/core.id": "{{newid}}"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].deletes['temp1']['uesio/core.id']" == "{{newid}}"
jsonpath "$.wires[0].errors" == null
