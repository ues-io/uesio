###################################################################
# Tests creating a collection, fields, and collection cascade delete
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Get a list of all fields available to our workspace for the animal collection
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.field",
            "id": "collection",
            "query":true,
            "fields": [
                {
                    "id": "uesio/studio.name"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.allmetadata",
                    "value": true
                },
                {
                    "field": "uesio/studio.grouping",
                    "value": "uesio/tests.animal"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 14
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.ancestor"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.autonumber"
jsonpath "$.wires[0].data[2]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.genus"
jsonpath "$.wires[0].data[3]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.lookalike"
jsonpath "$.wires[0].data[4]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.species"
jsonpath "$.wires[0].data[5]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.status"
jsonpath "$.wires[0].data[6]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.total_population"
jsonpath "$.wires[0].data[7]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.id"
jsonpath "$.wires[0].data[8]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.uniquekey"
jsonpath "$.wires[0].data[9]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.owner"
jsonpath "$.wires[0].data[10]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.createdby"
jsonpath "$.wires[0].data[11]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.updatedby"
jsonpath "$.wires[0].data[12]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.createdat"
jsonpath "$.wires[0].data[13]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.updatedat"
