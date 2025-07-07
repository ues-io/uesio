######################################################
# Tests enforcement of the max domains per user limit
######################################################

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
# Extract the sessionid from set-cookie header
HTTP 200
[Captures]
session_id: cookie "sessid"
user_id: jsonpath "$.user.id"

# Log in as ben to set the limit, since ben has permission to administer the Studio site (uesio does not)
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}
HTTP 200

# Set a limit of 1 domain per user
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/studio/prod/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.featureflag",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/studio.max_domains_per_user:{{user_id}}",
                    "uesio/core.value":1
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Log back in as uesio
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Delete the test site domain if it already exists. This should succeed even though our domain limit is very low.
# This ensures that we are ONLY enforcing the limit on new domains, not existing ones.
DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/api/v1/collection/uesio/studio/sitedomain?uesio/core.uniquekey=eq.test123:subdomain
x-uesio-app: uesio/tests
HTTP *
[Asserts]
status toString matches /^(204|404)$/

# Create a domain - should fail, since there are a lot of built in domains for uesio user already
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newdomain",
            "collection":"uesio/studio.sitedomain",
            "changes": {
                "1": {
                    "uesio/studio.domain": "test123",
                    "uesio/studio.type": "subdomain",
                    "uesio/studio.site": {
                        "uesio/core.uniquekey": "uesio/tests:testsite"
                    }
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors[0]['message']" == "this change would cause the user uesio to exceed their maximum number of allowed domains (1)"

# Make sure that the site domain was NOT inserted
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.sitedomain",
            "query": true,
            "fields": [
                {
                    "id": "uesio/core.uniquekey"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.domain",
                    "value": "test123"
                },
                {
                    "field": "uesio/studio.type",
                    "value": "subdomain"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty

# Log in as ben to set the limit, since ben has permission to administer the Studio site (uesio does not)
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}
HTTP 200

# Bump up the limit
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/studio/prod/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.featureflag",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/studio.max_domains_per_user:{{user_id}}",
                    "uesio/core.value":100
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Log back in as uesio
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Create a new domain - should succeed now
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
{
    "wires": [
        {
            "wire": "newdomain",
            "collection": "uesio/studio.sitedomain",
            "changes": {
                "1": {
                    "uesio/studio.domain": "test123",
                    "uesio/studio.type": "subdomain",
                    "uesio/studio.site": {
                        "uesio/core.uniquekey": "uesio/tests:testsite"
                    }
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['1']['uesio/core.uniquekey']" == "test123:subdomain"
jsonpath "$.wires[0].errors" == null
