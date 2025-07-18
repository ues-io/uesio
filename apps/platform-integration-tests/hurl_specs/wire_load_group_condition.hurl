######################################################
# Tests loading a wire with group conditions
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Test a wire load with a group condition (or)
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "conditions": [
                {
                    "type": "GROUP",
                    "conjunction": "OR",
                    "conditions": [
                        {
                            "field": "uesio/tests.species",
                            "value": "Jerrine"
                        },
                        {
                            "field": "uesio/tests.ancestor->uesio/tests.total_population",
                            "operator": "GT",
                            "value": 656700
                        }
                    ]
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
main.tenant = $2 AND
(main.fields->>'uesio/tests.species' = $3 OR
(main.fields->>'uesio/tests.ancestor')::uuid IN (SELECT subquery.id FROM data as "subquery" WHERE (subquery.collection = $4 AND
subquery.tenant = $5 AND
subquery.fields->'uesio/tests.total_population' > $6)))
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 3
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "MacAughtrie:Jerrine"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "McCreary:Jerrine"
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" contains "Kupker:Alain"

# Test a wire load with a group condition (and)
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "fields": [
                {
                    "id": "uesio/tests.genus"
                }
            ],
            "conditions": [
                {
                    "type": "GROUP",
                    "conditions": [
                        {
                            "field": "uesio/tests.species",
                            "value": "Jerrine"
                        },
                        {
                            "field": "uesio/tests.genus",
                            "value": "McCreary"
                        }
                    ]
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
'uesio/tests.genus',main.fields->'uesio/tests.genus'
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
(main.fields->>'uesio/tests.species' = $3 AND
main.fields->>'uesio/tests.genus' = $4)
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "McCreary:Jerrine"
