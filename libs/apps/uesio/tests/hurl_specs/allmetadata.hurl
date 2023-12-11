###########################################################################
# Tests wire loads on bundleable collections with the allmetadata condition
###########################################################################

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
            "collection": "uesio/studio.field",
            "name": "collection",
            "query": true,
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
            },
            "order": [
                {
                    "field": "uesio/core.uniquekey",
                    "desc": false
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 8
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.ancestor"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.autonumber"
jsonpath "$.wires[0].data[2]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.genus"
jsonpath "$.wires[0].data[3]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.lookalike"
jsonpath "$.wires[0].data[4]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.owner"
jsonpath "$.wires[0].data[5]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.species"
jsonpath "$.wires[0].data[6]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.status"
jsonpath "$.wires[0].data[7]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.total_population"

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
            },
            "order": [
                {
                    "field": "uesio/core.uniquekey",
                    "desc": false
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == {{num_common_fields}}
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.collection"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.createdat"
jsonpath "$.wires[0].data[2]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.createdby"
jsonpath "$.wires[0].data[3]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.id"
jsonpath "$.wires[0].data[4]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.owner"
jsonpath "$.wires[0].data[5]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.uniquekey"
jsonpath "$.wires[0].data[6]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.updatedat"
jsonpath "$.wires[0].data[7]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.updatedby"

# Get a list of all secrets available to our workspace
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.secret",
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
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].data[0]['uesio/studio.name']" == "openaikey"
jsonpath "$.wires[0].data[0]['uesio/studio.namespace']" == "uesio/core"
jsonpath "$.wires[0].data[1]['uesio/studio.name']" == "sendgridkey"
jsonpath "$.wires[0].data[1]['uesio/studio.namespace']" == "uesio/core"
jsonpath "$.wires[0].data[2]['uesio/core.uniquekey']" == "uesio/tests.test_oauth_client_id"
jsonpath "$.wires[0].data[3]['uesio/core.uniquekey']" == "uesio/tests.test_oauth_client_secret"
jsonpath "$.wires[0].data[4]['uesio/core.uniquekey']" == "uesio/tests.test_session_id"

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
jsonpath "$.wires[1].data" count == 8
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.ancestor"
jsonpath "$.wires[1].data[1]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.autonumber"
jsonpath "$.wires[1].data[2]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.genus"
jsonpath "$.wires[1].data[3]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.lookalike"
jsonpath "$.wires[1].data[4]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.owner"
jsonpath "$.wires[1].data[5]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.species"
jsonpath "$.wires[1].data[6]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.status"
jsonpath "$.wires[1].data[7]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.total_population"

# Test conditions on Credential by type, to verify that we can do per-item Bundleable Item filtering
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.credential",
            "name": "credentials",
            "query": true,
            "fields": [
                {
                    "id": "uesio/studio.name"
                },
                {
                    "id": "uesio/studio.type"
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
                    "field": "uesio/studio.type",
                    "valueSource": "VALUE",
                    "value": "API_KEY"
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
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "uesio/core.sendgrid"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "uesio/core.openai"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "uesio/tests.secret_access_allowed"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "uesio/tests.secret_access_forbidden"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "uesio/tests.test_api_key_credentials"
jsonpath "$.wires[0].data[*]['uesio/studio.label']" != ""
jsonpath "$.wires[0].data[*]['uesio/studio.label']" includes "Test API Key Credentials"

POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.credential",
            "name": "credentials",
            "query": true,
            "fields": [
                {
                    "id": "uesio/studio.name"
                },
                {
                    "id": "uesio/studio.type"
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
                    "field": "uesio/studio.type",
                    "valueSource": "VALUE",
                    "value": "OAUTH2_CREDENTIALS"
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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" includes "uesio/tests.test_oauth_credentials"

# Test pagination on a query for views in the workspace
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.view",
            "name": "views",
            "query": true,
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
            },
            "order": [
                {
                    "field": "uesio/core.uniquekey",
                    "desc": false
                }
            ],
            "batchsize": 5,
            "batchnumber": 0
        }
    ]
}
HTTP 200
[Captures]
last-batch-id: jsonpath "$.wires[0].data[4]['uesio/core.id']"
[Asserts]
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].batchnumber" == 0
jsonpath "$.wires[0].batchsize" == 5
jsonpath "$.wires[0].more" == true

POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.view",
            "name": "views",
            "query": true,
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
            },
            "order": [
                {
                    "field": "uesio/core.uniquekey",
                    "desc": false
                }
            ],
            "batchsize": 5,
            "batchnumber": 1
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].batchnumber" == 1
jsonpath "$.wires[0].batchsize" == 5
jsonpath "$.wires[0].more" == true
jsonpath "$.wires[0].data[0]['uesio/core.id']" != {{last-batch-id}}

# Do a query that loads all routes, to test that the "more" (HasMoreBatches) property
# is properly set to false when there are no more records available
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.route",
            "name": "routes",
            "query": true,
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
            },
            "order": [
                {
                    "field": "uesio/core.uniquekey",
                    "desc": false
                }
            ]
        }
    ]
}
HTTP 200
[Captures]
total-routes: jsonpath "$.wires[0].data" count
[Asserts]
jsonpath "$.wires[0].data" count > 0

POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.route",
            "name": "routes",
            "batchsize": {{total-routes}},
            "batchnumber": 0,
            "query": true,
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
            },
            "order": [
                {
                    "field": "uesio/core.uniquekey",
                    "desc": false
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == {{total-routes}}
jsonpath "$.wires[0].batchsize" == {{total-routes}}
jsonpath "$.wires[0].batchnumber" == 0
jsonpath "$.wires[0].more" == false