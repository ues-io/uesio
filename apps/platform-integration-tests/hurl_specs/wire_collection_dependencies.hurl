######################################################
# Tests loading of wire collection dependencies
# both during wire loads and on route loads of views with sub-views
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test that wire collection field dependencies are accumulated into a union of all fields
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "fields": [
                {
                    "id": "uesio/tests.genus"
                },
                {
                    "id": "uesio/tests.species"
                }
            ],
            "query":true,
            "batchsize":2
        },
        {
            "collection":"uesio/tests.animal",
            "fields": [
                {
                    "id": "uesio/core.createdat"
                },
                {
                    "id": "uesio/tests.species"
                }
            ],
            "query": true,
            "batchsize": 3
        }
    ],
    "includeMetadata": true
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" count == 2
jsonpath "$.wires[1].data[*]['uesio/core.uniquekey']" count == 3
# unique key and id fields will be automatically added by Uesio, to the 3 unique fields requested across the two wires,
# so we expect 5 unique fields
jsonpath "$.collections['uesio/tests.animal'].fields[*].name" count == 5
jsonpath "$.collections['uesio/tests.animal'].fields['uesio/core.createdat'].autopopulate" == "CREATE"
jsonpath "$.collections['uesio/tests.animal'].fields['uesio/tests.species'].updateable" == false
jsonpath "$.collections['uesio/tests.animal'].fields['uesio/tests.genus'].label" == "Genus"
jsonpath "$.collections['uesio/tests.animal'].fields['uesio/core.id'].label" == "Id"
jsonpath "$.collections['uesio/tests.animal'].fields['uesio/core.uniquekey'].label" == "Unique Key"

# Verify that wire collection dependencies are merged into a union, even across sub-view wire loads
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/wire_collection_deps_multiple_views
HTTP 200
[Asserts]
# unique key and id fields will be automatically added by Uesio, to the unique fields requested across the two wires,
# so we expect 9 unique fields
jsonpath "$.dependencies.collection[0].fields[*].name" count == 9
jsonpath "$.dependencies.collection[0].fields['uesio/tests.genus'].label" == "Genus"
jsonpath "$.dependencies.collection[0].fields['uesio/tests.species'].label" == "Species"
jsonpath "$.dependencies.collection[0].fields['uesio/tests.total_population'].label" == "Total Population"
jsonpath "$.dependencies.collection[0].fields['uesio/tests.lookalike'].type" == "REFERENCE"
jsonpath "$.dependencies.collection[0].fields['uesio/tests.ancestor'].type" == "REFERENCE"
jsonpath "$.dependencies.collection[0].fields['uesio/core.updatedat'].namespace" == "uesio/core"
jsonpath "$.dependencies.collection[0].fields['uesio/core.createdat'].namespace" == "uesio/core"
jsonpath "$.dependencies.collection[0].fields['uesio/core.id'].label" == "Id"
jsonpath "$.dependencies.collection[0].fields['uesio/core.uniquekey'].label" == "Unique Key"

