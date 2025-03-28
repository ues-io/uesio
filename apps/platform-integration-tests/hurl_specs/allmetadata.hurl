###########################################################################
# Tests wire loads on bundleable collections with the allmetadata condition
###########################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Get a list of all fields available to our workspace for the animal collection
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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
                },
                {
                    "id": "uesio/studio.collection"
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
    ],
    "includeMetadata": true
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 9
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.ancestor"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.autonumber"
jsonpath "$.wires[0].data[2]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.description_file"
jsonpath "$.wires[0].data[3]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.genus"
jsonpath "$.wires[0].data[4]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.keeper"
jsonpath "$.wires[0].data[5]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.lookalike"
jsonpath "$.wires[0].data[6]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.species"
jsonpath "$.wires[0].data[7]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.status"
jsonpath "$.wires[0].data[8]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.total_population"
jsonpath "$.collections['uesio/studio.field'].name" == "field"
jsonpath "$.collections['uesio/studio.field'].accessible" == true
jsonpath "$.collections['uesio/studio.field'].createable" == true
jsonpath "$.collections['uesio/studio.field'].updateable" == false
jsonpath "$.collections['uesio/studio.field'].deleteable" == false

# Test a multi-value condition on the grouping field
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.bot",
            "name": "bots",
            "query": true,
            "fields": [
                {
                    "id": "uesio/studio.name"
                },
                {
                    "id": "uesio/studio.type"
                },
                {
                    "id": "uesio/studio.collection"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.allmetadata",
                    "value": true
                },
                {
                    "field": "uesio/studio.grouping",
                    "operator": "IN",
                    "values": [
                        "BEFORESAVE",
                        "AFTERSAVE"
                    ]
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
jsonpath "$.wires[0].data" count == 4
jsonpath "$.wires[0].data[0]['uesio/studio.name']" == "get_config_value"
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "aftersave:uesio/tests.animal:uesio/tests.get_config_value"
jsonpath "$.wires[0].data[1]['uesio/studio.name']" == "increase_population"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "aftersave:uesio/tests.animal:uesio/tests.increase_population"
jsonpath "$.wires[0].data[2]['uesio/studio.name']" == "nozebras"
jsonpath "$.wires[0].data[2]['uesio/core.uniquekey']" == "aftersave:uesio/tests.animal:uesio/tests.nozebras"
jsonpath "$.wires[0].data[3]['uesio/studio.name']" == "decrease_population"
jsonpath "$.wires[0].data[3]['uesio/core.uniquekey']" == "beforesave:uesio/tests.animal:uesio/tests.decrease_population"

# Get a list of common fields available to our workspace for the animal collection
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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
# this number should be the number of common fields
# TODO: Unclear why this assert exists as its fragile and likely does not help in any way since underlying
# data can change across the test suite.  Evaluate this tests purpose and adjust the assert to be
# explicit/more meaningful. 
jsonpath "$.wires[0].data" count == 8
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.collection"
jsonpath "$.wires[0].data[1]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.createdat"
jsonpath "$.wires[0].data[2]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.createdby"
jsonpath "$.wires[0].data[3]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.id"
jsonpath "$.wires[0].data[4]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.owner"
jsonpath "$.wires[0].data[5]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.uniquekey"
jsonpath "$.wires[0].data[6]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.updatedat"
jsonpath "$.wires[0].data[7]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/core.updatedby"

# Get a list of all secrets available to our workspace
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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
                },
                {
                    "id": "uesio/studio.namespace"
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
jsonpath "$.wires[0].data[0]['uesio/studio.namespace']" == "uesio/aikit"
jsonpath "$.wires[0].data[1]['uesio/studio.name']" == "resend_key"
jsonpath "$.wires[0].data[1]['uesio/studio.namespace']" == "uesio/appkit"
jsonpath "$.wires[0].data[2]['uesio/core.uniquekey']" == "uesio/tests.test_oauth_client_id"
jsonpath "$.wires[0].data[3]['uesio/core.uniquekey']" == "uesio/tests.test_oauth_client_secret"
jsonpath "$.wires[0].data[4]['uesio/core.uniquekey']" == "uesio/tests.test_session_id"

# Test conditions on uesio/studio.item/grouping that have a ValueSource of LOOKUP from a previous wire
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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
                    "id": "uesio/studio.collection"
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
    ],
    "includeMetadata": true
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal"
jsonpath "$.wires[1].data" count == 9
jsonpath "$.wires[1].data[0]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.ancestor"
jsonpath "$.wires[1].data[1]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.autonumber"
jsonpath "$.wires[1].data[2]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.description_file"
jsonpath "$.wires[1].data[3]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.genus"
jsonpath "$.wires[1].data[4]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.keeper"
jsonpath "$.wires[1].data[5]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.lookalike"
jsonpath "$.wires[1].data[6]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.species"
jsonpath "$.wires[1].data[7]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.status"
jsonpath "$.wires[1].data[8]['uesio/core.uniquekey']" == "uesio/tests.animal:uesio/tests.total_population"
jsonpath "$.collections['uesio/studio.collection'].name" == "collection"
jsonpath "$.collections['uesio/studio.collection'].accessible" == true
jsonpath "$.collections['uesio/studio.collection'].createable" == true
jsonpath "$.collections['uesio/studio.collection'].updateable" == true
jsonpath "$.collections['uesio/studio.collection'].deleteable" == true

# Test conditions on Credential by type, to verify that we can do per-item Bundleable Item filtering
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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
                },
                {
                    "id": "uesio/studio.label"
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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "uesio/appkit.resend"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "uesio/tests.secret_access_allowed"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "uesio/tests.secret_access_forbidden"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "uesio/tests.test_api_key_credentials"
jsonpath "$.wires[0].data[*]['uesio/studio.label']" != ""
jsonpath "$.wires[0].data[*]['uesio/studio.label']" contains "Test API Key Credentials"

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "uesio/tests.test_oauth_credentials"

# Test pagination on a query for views in the workspace
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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

#Login as Ben he has access to the studio site
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}

#Site admin all metadata in studio context
#make sure we can read data as the siteadmin for the studio site
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/studio/prod/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.bot",
            "name": "bots",
            "query": true,
            "fields": [
                {
                    "id": "uesio/core.id"
                },
                {
                    "id": "uesio/studio.label"
                },
                {
                    "id": "uesio/studio.workspace",
                    "fields": [
                        {
                            "id": "uesio/core.id"
                        },
                        {
                            "id": "uesio/studio.app",
                            "fields": [
                                {
                                    "id": "uesio/studio.name"
                                }
                            ]
                        }
                    ]
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.workspace->uesio/studio.app->uesio/studio.name",
                    "operator": "EQ",
                    "value": "tests"
                }
            ],
            "batchsize": 5
        }
    ]
}
HTTP 200
[Captures]
last-bot-id: jsonpath "$.wires[0].data[4]['uesio/core.id']"
last-bot-label: jsonpath "$.wires[0].data[4]['uesio/studio.label']"
last-bot-workspace-id: jsonpath "$.wires[0].data[4]['uesio/studio.workspace']['uesio/core.id']"
[Asserts]
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].more" == true

#Site admin all metadata in studio context
#Change the label of one bot to make sure we got write access
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/studio/prod/wires/save
{
  "wires": [
    {
      "wire": "siteAdminStudioSave",
      "collection": "uesio/studio.bot",
      "changes": {
        "1": {
          "uesio/studio.label": "Nice Label For a Bot",
          "uesio/core.id": "{{last-bot-id}}"
        }
      },
      "params": {
        "app": "uesio/studio",
        "collectionname": "bot",
        "namespace": "uesio/studio",
        "sitename": "prod"
      }
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['1']['uesio/studio.label']" == "Nice Label For a Bot"
jsonpath "$.wires[0].changes['1']['uesio/core.id']" == "{{last-bot-id}}"
jsonpath "$.wires[0].errors" == null

# Fetch the bot using workspace mode to make sure the label was changed and cache invalidated
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.bot",
            "name": "bots",
            "query": true,
            "fields": [
                {
                    "id": "uesio/core.id"
                },
                {
                    "id": "uesio/studio.label"
                }
            ],
            "batchsize": 1,
            "conditions": [
                {
                    "field": "uesio/core.id",
                    "value": "{{last-bot-id}}"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "workspaceid": "{{last-bot-workspace-id}}"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "{{last-bot-id}}"
jsonpath "$.wires[0].data[0]['uesio/studio.label']" == "Nice Label For a Bot"
