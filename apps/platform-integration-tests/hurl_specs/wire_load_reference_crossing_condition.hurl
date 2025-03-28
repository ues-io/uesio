######################################################
# Tests loading a wire with reference-crossing conditions
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test a wire load with a single reference-crossing condition
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
                    "field": "uesio/tests.user->uesio/core.username",
                    "operator": "EQ",
                    "value": "uesio"
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
subquery.fields->>'uesio/core.username' = $5)) AND
main.fields->>'uesio/tests.text' is distinct from $6
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[0]['uesio/tests.text']" == "text 2"

# Test a wire load with a reference-crossing condition on multiple standard reference fields
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
                    "field": "uesio/core.owner->uesio/core.username",
                    "operator": "EQ",
                    "value": "uesio"
                },
                {
                    "field": "uesio/core.updatedby->uesio/core.username",
                    "operator": "EQ",
                    "value": "uesio"
                },
                {
                    "field": "uesio/core.createdby->uesio/core.username",
                    "operator": "EQ",
                    "value": "uesio"
                },
                {
                    "field": "uesio/tests.text",
                    "operator": "NOT_EQ",
                    "value": null
                },
                {
                    "field": "uesio/tests.text",
                    "operator": "NOT_EQ",
                    "value": ""
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
main.owner IN (SELECT subquery.id FROM data as "subquery" WHERE (subquery.collection = $3 AND
subquery.tenant = $4 AND
subquery.fields->>'uesio/core.username' = $5)) AND
main.updatedby IN (SELECT subquery.id FROM data as "subquery" WHERE (subquery.collection = $6 AND
subquery.tenant = $7 AND
subquery.fields->>'uesio/core.username' = $8)) AND
main.createdby IN (SELECT subquery.id FROM data as "subquery" WHERE (subquery.collection = $9 AND
subquery.tenant = $10 AND
subquery.fields->>'uesio/core.username' = $11)) AND
main.fields->>'uesio/tests.text' is distinct from $12 AND
main.fields->>'uesio/tests.text' is distinct from $13
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/tests.text']" count == 5

# Test a wire load with a 2-deep reference-crossing condition
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "fields":[
                {
                    "id": "uesio/tests.name"
                },
                {
                    "id": "uesio/tests.text"
                },
                {
                    "id": "uesio/core.uniquekey"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/tests.reference->uesio/tests.user->uesio/core.username",
                    "operator": "EQ",
                    "value": "zach"
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
'uesio/tests.name',main.fields->'uesio/tests.name',
'uesio/tests.text',main.fields->'uesio/tests.text'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
(main.fields->>'uesio/tests.reference')::uuid IN (SELECT subquery.id FROM data as "subquery" WHERE (subquery.collection = $3 AND
subquery.tenant = $4 AND
(subquery.fields->>'uesio/tests.user')::uuid IN (SELECT subquery.id FROM data as "subquery" WHERE (subquery.collection = $5 AND
subquery.tenant = $6 AND
subquery.fields->>'uesio/core.username' = $7)))) AND
main.fields->>'uesio/tests.text' is distinct from $8
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/tests.text']" contains "text 4"
jsonpath "$.wires[0].data[*]['uesio/tests.text']" contains "text 5"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-004"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-005"

# Test a wire load with a single reference-crossing condition with a param
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "query":true,
            "params": {
                "myparam": "uesio"
            },
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
                    "field": "uesio/tests.user->uesio/core.username",
                    "operator": "EQ",
                    "valueSource": "PARAM",
                    "param": "myparam"
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
subquery.fields->>'uesio/core.username' = $5))
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[0]['uesio/tests.text']" == "text 2"
