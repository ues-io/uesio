###################################################################
# Tests creating a collection, fields, and collection cascade delete
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Get a list of all fields available to our workspace for the animal collection
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.field",
            "name": "collection",
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
jsonpath "$.wires[0].data" count == 7
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.ancestor"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.autonumber"
jsonpath "$.wires[0].data[2]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.genus"
jsonpath "$.wires[0].data[3]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.lookalike"
jsonpath "$.wires[0].data[4]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.species"
jsonpath "$.wires[0].data[5]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.status"
jsonpath "$.wires[0].data[6]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.total_population"

# Get a list of common fields available to our workspace for the animal collection
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.field",
            "name": "collection",
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
                },
                {
                    "field": "uesio/studio.iscommonfield",
                    "value": true
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
jsonpath "$.wires[0].data" count == 7
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.id"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.uniquekey"
jsonpath "$.wires[0].data[2]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.owner"
jsonpath "$.wires[0].data[3]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.createdby"
jsonpath "$.wires[0].data[4]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.updatedby"
jsonpath "$.wires[0].data[5]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.createdat"
jsonpath "$.wires[0].data[6]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.updatedat"

# Get a list of all secrets available to our workspace
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.secret",
            "name": "collection",
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
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/studio.name']" == "sendgridkey"
jsonpath "$.wires[0].data[0]['uesio/studio.namespace']" == "uesio/core"

# Test conditions on uesio/studio.item/grouping that have a ValueSource of LOOKUP from a previous wire
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.collection",
            "name": "collection",
            "query": true,
            "fields": [
                {
                    "id": "uesio/core.uniquekey"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.allmetadata",
                    "value": true
                },
                {
                    "field": "uesio/studio.item",
                    "value": "uesio/tests.animal"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        },
        {
            "collection": "uesio/studio.field",
            "name": "fields",
            "query": true,
            "fields": [
                {
                    "id": "uesio/studio.name"
                },
                {
                    "id": "uesio/core.uniquekey"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.allmetadata",
                    "value": true
                },
                {
                    "field": "uesio/studio.grouping",
                    "valueSource": "LOOKUP",
                    "lookupWire": "collection",
                    "lookupField": "uesio/core.uniquekey"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            },
            "order": [
                {
                    "field": "uesio/studio.name",
                    "desc": false
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal"
jsonpath "$.wires[1].data" count == 7
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.ancestor"
jsonpath "$.wires[1].data[1]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.autonumber"
jsonpath "$.wires[1].data[2]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.genus"
jsonpath "$.wires[1].data[3]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.lookalike"
jsonpath "$.wires[1].data[4]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.species"
jsonpath "$.wires[1].data[5]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.status"
jsonpath "$.wires[1].data[6]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.total_population"
