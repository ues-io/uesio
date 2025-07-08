######################################################
# Tests loading an external uesio-site-to-site integration
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Test a simple external load
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal_external",
            "fields": [
                {
                    "id": "uesio/tests.genus_external"
                },
                {
                    "id": "uesio/tests.species_external"
                }
            ],
            "order": [
                {
                    "field": "uesio/tests.species_external"
                }
            ],
            "query":true,
            "batchSize":2
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/tests.genus_external']" == "Blazewski"
jsonpath "$.wires[0].data[0]['uesio/tests.species_external']" == "Aaron"
jsonpath "$.wires[0].data[1]['uesio/tests.genus_external']" == "Rainard"
jsonpath "$.wires[0].data[1]['uesio/tests.species_external']" == "Abbi"
jsonpath "$.collections" not exists
