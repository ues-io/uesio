###################################################################
# Tests the bundleable metadata wires in the core namespace
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Test a wire load with no conditions
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/core.signupmethod",
            "query": true,
            "order": [
                {
                    "field": "uesio/core.uniquekey",
                    "desc": false
                }
            ]
        }
    ],
    "includeMetadata": true
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/core.name']" == "google"
jsonpath "$.wires[0].data[0]['uesio/core.namespace']" == "uesio/studio"
jsonpath "$.wires[0].data[0]['uesio/core.authsource']" == "uesio/core.google"
jsonpath "$.wires[0].data[0]['uesio/core.appicon']" == "design_services"
jsonpath "$.wires[0].data[1]['uesio/core.name']" == "platform"
jsonpath "$.wires[0].data[1]['uesio/core.namespace']" == "uesio/studio"
jsonpath "$.wires[0].data[1]['uesio/core.authsource']" == "uesio/core.platform"
jsonpath "$.wires[0].data[1]['uesio/core.appicon']" == "design_services"
jsonpath "$.collections['uesio/core.signupmethod'].name" == "signupmethod"
jsonpath "$.collections['uesio/core.signupmethod'].fields['uesio/core.name'].name" == "name"
jsonpath "$.collections['uesio/core.signupmethod'].fields['uesio/core.name'].namespace" == "uesio/core"
jsonpath "$.collections['uesio/core.signupmethod'].fields['uesio/core.namespace'].name" == "namespace"
jsonpath "$.collections['uesio/core.signupmethod'].fields['uesio/core.namespace'].namespace" == "uesio/core"
jsonpath "$.collections['uesio/core.signupmethod'].fields['uesio/core.authsource'].name" == "authsource"
jsonpath "$.collections['uesio/core.signupmethod'].fields['uesio/core.authsource'].namespace" == "uesio/core"
jsonpath "$.collections['uesio/core.signupmethod'].fields['uesio/core.appicon'].name" == "appicon"
jsonpath "$.collections['uesio/core.signupmethod'].fields['uesio/core.appicon'].namespace" == "uesio/core"
