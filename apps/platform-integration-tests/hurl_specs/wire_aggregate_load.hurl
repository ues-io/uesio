######################################################
# Tests loading an aggregate wire
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}


# Test an aggregate wire load with no conditions
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [
                {
                    "id": "uesio/tests.category",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/tests.category"
                }
            ],
            "aggregate":true,
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
# If this test is failing for you, make sure you have `UESIO_DEBUG_SQL=true` set locally
# and then re-run the app
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/tests.category',main.fields->>'uesio/tests.category',
'uesio/tests.category_count',COUNT(main.fields->>'uesio/tests.category')
),main.fields->>'uesio/tests.category'
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2
GROUP BY 2
ORDER BY 2
LIMIT 501```
jsonpath "$.wires[0].data" count == 4
jsonpath "$.wires[0].data[0]['uesio/tests.category']" == ""
jsonpath "$.wires[0].data[0]['uesio/tests.category_count']" == 2
jsonpath "$.wires[0].data[1]['uesio/tests.category']" == "a"
jsonpath "$.wires[0].data[1]['uesio/tests.category_count']" == 3
jsonpath "$.wires[0].data[2]['uesio/tests.category']" == "b"
jsonpath "$.wires[0].data[2]['uesio/tests.category_count']" == 4
jsonpath "$.wires[0].data[3]['uesio/tests.category']" == "c"
jsonpath "$.wires[0].data[3]['uesio/tests.category_count']" == 1
jsonpath "$.collections" not exists

# Test an aggregate wire load with a condition
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [
                {
                    "id": "uesio/tests.category",
                    "function": "COUNT"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/tests.category",
                    "operator": "IS_NOT_BLANK"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/tests.category"
                }
            ],
            "aggregate":true,
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
# If this test is failing for you, make sure you have `UESIO_DEBUG_SQL=true` set locally
# and then re-run the app
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/tests.category',main.fields->>'uesio/tests.category',
'uesio/tests.category_count',COUNT(main.fields->>'uesio/tests.category')
),main.fields->>'uesio/tests.category'
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
((main.fields->>'uesio/tests.category' IS NOT NULL) AND (main.fields->>'uesio/tests.category' != 'null') AND (main.fields->>'uesio/tests.category' != ''))
GROUP BY 2
ORDER BY 2
LIMIT 501```
jsonpath "$.wires[0].data" count == 3
jsonpath "$.wires[0].data[0]['uesio/tests.category']" == "a"
jsonpath "$.wires[0].data[0]['uesio/tests.category_count']" == 3
jsonpath "$.wires[0].data[1]['uesio/tests.category']" == "b"
jsonpath "$.wires[0].data[1]['uesio/tests.category_count']" == 4
jsonpath "$.wires[0].data[2]['uesio/tests.category']" == "c"
jsonpath "$.wires[0].data[2]['uesio/tests.category_count']" == 1
jsonpath "$.collections" not exists

# Test an aggregate wire load with no conditions and an ordering
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [
                {
                    "id": "uesio/tests.category",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/tests.category"
                }
            ],
            "order": [
                {
                    "field": "uesio/tests.category",
                    "desc": true
                }
            ],
            "aggregate":true,
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
# If this test is failing for you, make sure you have `UESIO_DEBUG_SQL=true` set locally
# and then re-run the app
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/tests.category',main.fields->>'uesio/tests.category',
'uesio/tests.category_count',COUNT(main.fields->>'uesio/tests.category')
),main.fields->>'uesio/tests.category'
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2
GROUP BY 2
ORDER BY main.fields->>'uesio/tests.category' desc
LIMIT 501```
jsonpath "$.wires[0].data" count == 4
jsonpath "$.wires[0].data[0]['uesio/tests.category']" == "c"
jsonpath "$.wires[0].data[0]['uesio/tests.category_count']" == 1
jsonpath "$.wires[0].data[1]['uesio/tests.category']" == "b"
jsonpath "$.wires[0].data[1]['uesio/tests.category_count']" == 4
jsonpath "$.wires[0].data[2]['uesio/tests.category']" == "a"
jsonpath "$.wires[0].data[2]['uesio/tests.category_count']" == 3
jsonpath "$.wires[0].data[3]['uesio/tests.category']" == ""
jsonpath "$.wires[0].data[3]['uesio/tests.category_count']" == 2
jsonpath "$.collections" not exists


# Test an aggregate wire load with a date groupby function
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [
                {
                    "id": "uesio/core.id",
                    "function": "COUNT"
                }
            ],
            "groupby": [
                {
                    "id": "uesio/core.createdat",
                    "function": "DATE_TRUNC_DAY"
                }
            ],
            "aggregate":true,
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
# If this test is failing for you, make sure you have `UESIO_DEBUG_SQL=true` set locally
# and then re-run the app
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/core.createdat_date_trunc_day',DATE_TRUNC('day',to_timestamp(date_part('epoch',main.createdat)))::date,
'uesio/core.id_count',COUNT(main.id)
),DATE_TRUNC('day',to_timestamp(date_part('epoch',main.createdat)))::date
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2
GROUP BY 2
ORDER BY 2
LIMIT 501```
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.id_count']" == 10
jsonpath "$.collections" not exists
