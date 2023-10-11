###################################################################
# Tests required of a Field on save
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test try to INSERT missing a required field on changes
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/tests.species":"Thylacine"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" count == 1
jsonpath "$.wires[0].errors[0].message" == "Field: Genus is required"
jsonpath "$.wires[0].errors[0].fieldid" == "uesio/tests.genus"

# Test try to INSERT required field as empty string
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/tests.species":"Thylacine",
                    "uesio/tests.genus":""
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" count == 1
jsonpath "$.wires[0].errors[0].message" == "Field: Genus is required"
jsonpath "$.wires[0].errors[0].fieldid" == "uesio/tests.genus"


# Get a record to test the UPDATES
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
                    "id": "uesio/core.uniquekey"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Jurick:Xylia"
                }
            ]
        }
    ]
}
HTTP 200
[Captures]
idvalue: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# Test try to UPDATE nulling required field on changes
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id":"{{idvalue}}",
                    "uesio/tests.species":"Thylacine",
                    "uesio/tests.genus": null
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" count == 1
jsonpath "$.wires[0].errors[0].message" == "Field: Genus is required"
jsonpath "$.wires[0].errors[0].fieldid" == "uesio/tests.genus"

# Test try to UPDATE nulling with empty string a required field on changes
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id":"{{idvalue}}",
                    "uesio/tests.species":"Thylacine",
                    "uesio/tests.genus": ""
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" count == 1
jsonpath "$.wires[0].errors[0].message" == "Field: Genus is required"
jsonpath "$.wires[0].errors[0].fieldid" == "uesio/tests.genus"
