###########################################################################
# Tests loading the my_integration_credentials collection
###########################################################################

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200
[Captures]
user_id: jsonpath "$.user.id"

POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/core.myintegrationcredentials",
            "name": "mycredentials",
            "query": true,
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
# When we don't have an existing record, we just use the integration name as the id
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "uesio/tests.oauth2_authorization_code_1"
jsonpath "$.wires[0].data[0]['uesio/core.integration']" == "uesio/tests.oauth2_authorization_code_1"
jsonpath "$.wires[0].data[0]['uesio/core.user']" == "{{user_id}}"
jsonpath "$.wires[0].data[0]['uesio/core.hasaccesstoken']" == false
jsonpath "$.wires[0].data[0]['uesio/core.hasrefreshtoken']" == false
jsonpath "$.wires[0].data[1]['uesio/core.id']" == "uesio/tests.oauth2_authorization_code_2"
jsonpath "$.wires[0].data[1]['uesio/core.integration']" == "uesio/tests.oauth2_authorization_code_2"
jsonpath "$.wires[0].data[1]['uesio/core.user']" == "{{user_id}}"
jsonpath "$.wires[0].data[1]['uesio/core.hasaccesstoken']" == false
jsonpath "$.wires[0].data[1]['uesio/core.hasrefreshtoken']" == false


POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/core.myintegrationcredentials",
            "name": "mycredentials",
            "query": true,
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            },
            "conditions": [
                {
                    "field": "uesio/core.integration",
                    "operator": "EQ",
                    "value": "uesio/tests.oauth2_authorization_code_2"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
# When we don't have an existing record, we just use the integration name as the id
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "uesio/tests.oauth2_authorization_code_2"
jsonpath "$.wires[0].data[0]['uesio/core.integration']" == "uesio/tests.oauth2_authorization_code_2"
jsonpath "$.wires[0].data[0]['uesio/core.user']" == "{{user_id}}"
jsonpath "$.wires[0].data[0]['uesio/core.hasaccesstoken']" == false
jsonpath "$.wires[0].data[0]['uesio/core.hasrefreshtoken']" == false
