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

# Test a wire load with no conditions
POST https://{{host}}:{{port}}/siteadmin/uesio/studio/prod/wires/load
Accept: application/json
[Options]
{
    "wires": [
        {
            "collection":"uesio/core.usage",
            "query":true,
            "batchsize":100,
            "fields":[],
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
