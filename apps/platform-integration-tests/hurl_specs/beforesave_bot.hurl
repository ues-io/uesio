######################################################
# Tests before save bot
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Try to insert a Lowland streaked tenrec and check if the aftersave bot increased the population to 10
# and the before save decrease in 6
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/tests.species":"Lowland streaked tenrec",
                    "uesio/tests.genus":"Hemicentetes",
                    "uesio/tests.total_population": 2
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
jsonpath "$.wires[0].changes['temp1']['uesio/tests.species']" == "Lowland streaked tenrec"
jsonpath "$.wires[0].changes['temp1']['uesio/tests.genus']" == "Hemicentetes"
jsonpath "$.wires[0].changes['temp1']['uesio/tests.total_population']" == 6