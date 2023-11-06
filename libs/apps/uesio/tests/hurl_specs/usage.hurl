######################################################
# Tests usage load collection
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}


# Run the usage job so that we're sure to have usage data available
POST https://{{host}}:{{port}}/site/worker/usage
Accept: application/json
HTTP 200
[Asserts]
body == "Usage Worker Success"

# load usage for the Studio prod site
POST https://{{host}}:{{port}}/siteadmin/uesio/studio/prod/wires/load
Accept: application/json
[Options]
{
    "wires": [
        {
            "collection": "uesio/core.usage",
            "query": true,
            "batchsize": 10,
            "fields": [],
            "conditions": [
                {
                    "field": "metadatatype",
                    "value": "COLLECTION"
                },
                {
                    "field": "actiontype",
                    "value": "LOAD"
                }
            ],
            "order": [
                {
                    "field": "day",
                    "desc": true
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count > 0
jsonpath "$.wires[0].data" count <= 10 # verify batchsize works
jsonpath "$.wires[0].data[0]['uesio/core.metadatatype']" == "COLLECTION"
jsonpath "$.wires[0].data[0]['uesio/core.actiontype']" == "LOAD"
jsonpath "$.wires[0].data[0]['uesio/core.total']" >= 1
jsonpath "$.wires[0].collection" == "uesio/core.usage"

# Load with different conditions
POST https://{{host}}:{{port}}/siteadmin/uesio/studio/prod/wires/load
Accept: application/json
[Options]
{
    "wires": [
        {
            "collection": "uesio/core.usage",
            "query": true,
            "batchsize": 10,
            "fields": [],
            "conditions": [
                {
                    "field": "metadatatype",
                    "value": "COLLECTION"
                },
                {
                    "field": "actiontype",
                    "value": "SAVE"
                },
                {
                    "field": "total",
                    "operator": "GT",
                    "value": 4
                }
            ],
            "order": [
                {
                    "field": "day",
                    "desc": true
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count > 0
jsonpath "$.wires[0].data" count <= 10 # verify batchsize works
jsonpath "$.wires[0].data[0]['uesio/core.metadatatype']" == "COLLECTION"
jsonpath "$.wires[0].data[0]['uesio/core.actiontype']" == "SAVE"
jsonpath "$.wires[0].data[0]['uesio/core.total']" > 4
