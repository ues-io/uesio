###########################################################################
# Tests loading the my_integration_credentials collection
###########################################################################

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200
[Captures]
user_id: jsonpath "$.user.id"

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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

# Load multiple desired integrations
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
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
                    "operator": "IN",
                    "valueSource": "VALUE",
                    "values": [
                        "uesio/tests.oauth2_authorization_code_1",
                        "uesio/tests.oauth2_authorization_code_2"
                    ]
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
# When we don't have an existing record, we just use the integration name as the id
jsonpath "$.wires[0].data[*]['uesio/core.integration']" contains "uesio/tests.oauth2_authorization_code_1"
jsonpath "$.wires[0].data[*]['uesio/core.integration']" contains "uesio/tests.oauth2_authorization_code_2"
jsonpath "$.wires[0].data[0]['uesio/core.user']" == "{{user_id}}"
jsonpath "$.wires[0].data[1]['uesio/core.user']" == "{{user_id}}"
