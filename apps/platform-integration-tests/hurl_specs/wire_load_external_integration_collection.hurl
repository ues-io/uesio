######################################################
# Tests loading a wire whose source is an integration
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Test a wire load with no conditions
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/tests.task",
            "fields": [
                { "id": "uesio/core.id" },
                { "id": "uesio/tests.subject" },
                { "id": "uesio/tests.status" },
                { "id": "uesio/tests.priority" }
            ],
            "query": true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].data[0]['uesio/core.id']" == 1
jsonpath "$.wires[0].data[0]['uesio/tests.status'].color" == "green"
jsonpath "$.wires[0].data[0]['uesio/tests.status'].name" == "Open"
jsonpath "$.wires[0].data[0]['uesio/tests.priority']" == 1
jsonpath "$.wires[0].data[0]['uesio/tests.subject']" == "Alpha"

# Test a wire load with VALUE conditions
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/tests.task",
            "fields": [
                { "id": "uesio/core.id" },
                { "id": "uesio/tests.subject" },
                { "id": "uesio/tests.status" },
                { "id": "uesio/tests.priority" }
            ],
            "conditions": [
                {
                    "field": "uesio/tests.priority",
                    "operator": "GT",
                    "valueSource": "VALUE",
                    "value": 1
                },
                {
                    "field": "uesio/tests.status->name",
                    "operator": "IN",
                    "valueSource": "VALUE",
                    "values": [
                        "In Progress"
                    ]
                }
            ],
            "query": true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.id']" == 3
jsonpath "$.wires[0].data[0]['uesio/tests.status'].color" == "yellow"
jsonpath "$.wires[0].data[0]['uesio/tests.status'].name" == "In Progress"
jsonpath "$.wires[0].data[0]['uesio/tests.priority']" == 3
jsonpath "$.wires[0].data[0]['uesio/tests.subject']" == "Gamma"

# Test a wire load with conditions of valueSource: PARAM
# Verify that the resolved values are provided to the Bot conditions,
# NOT the raw values (which would be useless).
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/tests.task",
            "fields": [
                { "id": "uesio/core.id" },
                { "id": "uesio/tests.subject" },
                { "id": "uesio/tests.status" },
                { "id": "uesio/tests.priority" }
            ],
            "conditions": [
                {
                    "field": "uesio/tests.priority",
                    "operator": "LT",
                    "valueSource": "PARAM",
                    "param": "maxPriority"
                },
                {
                    "field": "uesio/tests.status->name",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "status"
                }
            ],
            "query": true,
            "params": {
                "maxPriority": "3",
                "status": "Completed"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/core.id']" == 4
jsonpath "$.wires[0].data[0]['uesio/tests.status'].color" == "purple"
jsonpath "$.wires[0].data[0]['uesio/tests.status'].name" == "Completed"
jsonpath "$.wires[0].data[0]['uesio/tests.priority']" == 2
jsonpath "$.wires[0].data[0]['uesio/tests.subject']" == "Delta"
jsonpath "$.wires[0].data[1]['uesio/core.id']" == 5
jsonpath "$.wires[0].data[1]['uesio/tests.status'].color" == "purple"
jsonpath "$.wires[0].data[1]['uesio/tests.status'].name" == "Completed"
jsonpath "$.wires[0].data[1]['uesio/tests.priority']" == 1
jsonpath "$.wires[0].data[1]['uesio/tests.subject']" == "Zeta"

