######################################################
# Tests multi-collection reference fields
######################################################

#insert a multicollection record 
# col1 and col2  
#read the multicollection record
# verify col1 is and col2 is col2

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# GET an account and contact uuid
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "batchsize":1
        },
        {
            "collection":"uesio/tests.contact",
            "fields": [{"id": "uesio/tests.lastname"}],
            "query":true,
            "batchsize":1
        }
    ]
}
HTTP 200
[Captures]
ACC-UUID: jsonpath "$.wires[0].data[0]['uesio/core.id']"
CON-UUID: jsonpath "$.wires[1].data[0]['uesio/core.id']"
CON-LASTNAME: jsonpath "$.wires[1].data[0]['uesio/tests.lastname']"

# insert a cat owned by the account
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
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
                    "uesio/tests.keeper": {
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
                    "id": "uesio/tests.keeper"
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
jsonpath "$.wires[0].data[0]['uesio/tests.keeper']['uesio/core.collection']" == "uesio/tests.account"
jsonpath "$.wires[0].data[0]['uesio/tests.keeper']['uesio/core.id']" == "{{ACC-UUID}}"

# insert a pig owned by the contact
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/tests.species": "Pig",
                    "uesio/tests.genus": "Felis",
                    "uesio/tests.keeper": {
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
jsonpath "$.wires[0].changes['temp1']['uesio/tests.species']" == "Pig"
jsonpath "$.wires[0].changes['temp1']['uesio/tests.genus']" == "Felis"
jsonpath "$.wires[0].changes['temp1']['uesio/core.id']" matches /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
jsonpath "$.wires[0].errors" == null
[Captures]
PIG-CON-UUID: jsonpath "$.wires[0].changes[*]['uesio/core.id']" nth 0

# Get the pig owned by contant record and check the multicollection
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
                    "id": "uesio/tests.keeper"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.id",
                    "value": "{{PIG-CON-UUID}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/tests.keeper']['uesio/core.collection']" == "uesio/tests.contact"
jsonpath "$.wires[0].data[0]['uesio/tests.keeper']['uesio/core.id']" == "{{CON-UUID}}"
#Make sure the lastname field (the contact collection name field)
jsonpath "$.wires[0].data[0]['uesio/tests.keeper']['uesio/tests.lastname']" == "{{CON-LASTNAME}}"