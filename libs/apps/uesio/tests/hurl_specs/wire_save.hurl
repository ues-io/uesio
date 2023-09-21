######################################################
# Tests loading a wire
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Get a record
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
                    "value": "Kupker:Alain"
                }
            ]
        }
    ]
}
HTTP 200
[Captures]
idvalue: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# Test a simple update
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
                    "uesio/tests.species":"Frog",
                    "uesio/tests.genus":"Genie"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/tests.species']" == "Frog"
jsonpath "$.wires[0].changes['temp1']['uesio/tests.genus']" == "Genie"
#jsonpath "$.wires[0].changes['temp1']['uesio/core.id']" matches /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
jsonpath "$.wires[0].errors" == null

# Now see if the update worked
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
                    "field": "uesio/core.id",
                    "value": "{{idvalue}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.genus']" == "Genie"
jsonpath "$.wires[0].data[0]['uesio/tests.species']" == "Frog"
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "Genie:Frog"

# Test a simple delete
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{
                "temp1":{
                    "uesio/core.id":"{{idvalue}}"
                }
            },
            "changes":{},
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Test a simple insert
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/tests.species": "Alain",
                    "uesio/tests.genus": "Kupker"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/tests.species']" == "Alain"
jsonpath "$.wires[0].changes['temp1']['uesio/tests.genus']" == "Kupker"
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
jsonpath "$.wires[0].data[0]['uesio/tests.genus']" == "Kupker"
jsonpath "$.wires[0].data[0]['uesio/tests.species']" == "Alain"
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "Kupker:Alain"
