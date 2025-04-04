######################################################
# Tests loading a wire with novaluebehavior conditions
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test a wire load with no novaluebehavor property on the condition
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "conditions": [
                {
                    "valueSource": "PARAM",
                    "param": "genus",
                    "field": "uesio/tests.genus"
                }
            ],
            "batchsize": 1
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].errors[0].message" contains "Invalid Condition, param 'genus' was not provided"

# Test again a wire load with novaluebehavor property set to deactivate on the condition
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "conditions": [
                {
                    "valueSource": "PARAM",
                    "param": "genus",
                    "field": "uesio/tests.genus",
                    "noValueBehavior": "DEACTIVATE"
                }
            ],
            "batchsize": 1,
            "order": [
                {
                    "field": "uesio/tests.species"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2
ORDER BY main.fields->>'uesio/tests.species' asc
LIMIT 2```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "Blazewski:Aaron"

# Test again a wire load with novaluebehavor property set to noquery on the condition
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.genus",
                    "value": "",
                    "noValueBehavior": "NOQUERY"
                }
            ],
            "batchsize": 1,
            "order": [
                {
                    "field": "uesio/tests.species"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].debugQueryString" == ""
jsonpath "$.wires[0].data" count == 0


