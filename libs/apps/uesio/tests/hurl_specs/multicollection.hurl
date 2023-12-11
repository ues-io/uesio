######################################################
# Tests multi-collection
######################################################


#insert a multicollection record 
# col1 and col2  
#read the multicollection record
# verify col1 is and col2 is col2

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# GET an account uuid
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "batchsize":1
        }
    ]
}
HTTP 200
[Captures]
ACC-UUID: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# GET an contact uuid
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.contact",
            "query":true,
            "batchsize":1
        }
    ]
}
HTTP 200
[Captures]
CON-UUID: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# insert a cat owned by the account
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/tests.species": "Cat",
                    "uesio/tests.genus": "Felis",
                    "uesio/tests.owner": {
                        "uesio/core.id": "{{ACC-UUID}}"
                    }
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/tests.species']" == "Cat"
jsonpath "$.wires[0].changes['temp1']['uesio/tests.genus']" == "Felis"
jsonpath "$.wires[0].changes['temp1']['uesio/core.id']" matches /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
jsonpath "$.wires[0].errors" == null
[Captures]
CAT-ACC-UUID: jsonpath "$.wires[0].changes[*]['uesio/core.id']" nth 0

# Get the cat owned by account record and check the multicollection
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
                    "id": "uesio/tests.owner"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.id",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "value": "{{CAT-ACC-UUID}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.owner']['uesio/core.collection']" == "uesio/tests.account"
jsonpath "$.wires[0].data[0]['uesio/tests.owner']['uesio/core.id']" == "{{ACC-UUID}}"

# insert a cat owned by the contact
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/tests.species": "Cat",
                    "uesio/tests.genus": "Felis",
                    "uesio/tests.owner": {
                        "uesio/core.id": "{{CON-UUID}}"
                    }
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/tests.species']" == "Cat"
jsonpath "$.wires[0].changes['temp1']['uesio/tests.genus']" == "Felis"
jsonpath "$.wires[0].changes['temp1']['uesio/core.id']" matches /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
jsonpath "$.wires[0].errors" == null
[Captures]
CAT-CON-UUID: jsonpath "$.wires[0].changes[*]['uesio/core.id']" nth 0


# Get the cat owned by contant record and check the multicollection
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
                    "id": "uesio/tests.owner"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.id",
                    "value": "{{CAT-CON-UUID}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.owner']['uesio/core.collection']" == "uesio/tests.contact"
jsonpath "$.wires[0].data[0]['uesio/tests.owner']['uesio/core.id']" == "{{CON-UUID}}"