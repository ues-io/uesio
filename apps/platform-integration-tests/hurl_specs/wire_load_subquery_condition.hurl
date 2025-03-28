######################################################
# Tests loading a wire with subquery conditions
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test a wire load with a single subquery condition
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields":[
                {
                    "id": "uesio/tests.text"
                },
                {
                    "id": "uesio/core.uniquekey"
                }
            ],
            "conditions": [
                {
                    "type": "SUBQUERY",
                    "field": "uesio/tests.user",
                    "operator": "IN",
                    "subcollection": "uesio/core.user",
                    "subfield": "uesio/core.id",
                    "conditions": [
                        {
                            "field": "uesio/core.username",
                            "operator": "IN",
                            "values": [
                                "uesio"
                            ]
                        }
                    ]
                },
                {
                    "field": "uesio/tests.text",
                    "operator": "NOT_EQ",
                    "value": null
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey,
'uesio/tests.text',main.fields->'uesio/tests.text'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
(main.fields->>'uesio/tests.user')::uuid IN (SELECT subquery.id FROM data as "subquery" WHERE (subquery.collection = $3 AND
subquery.tenant = $4 AND
array_position($5,subquery.fields->>'uesio/core.username') IS NOT NULL)) AND
main.fields->>'uesio/tests.text' is distinct from $6
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[0]['uesio/tests.text']" == "text 2"
