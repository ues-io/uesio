# Log into the studio as uesio
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Unset the google auth source config client id value
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/tests/testsite/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/core.google_auth_client_id",
                    "uesio/core.value":""
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Verify that the google auth source config client id value was unset
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/tests/testsite/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "fields": [],
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].data[4]['uesio/core.namespace']" == "uesio/core"
jsonpath "$.wires[0].data[4]['uesio/core.name']" == "google_auth_client_id"
jsonpath "$.wires[0].data[4]['uesio/core.value']" == ""

# Log in to google with the wrong client id
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/google/login
{
    "credential": "A Random Credential",
    "client_id": "The client id provided by the server should be missing for this test"
}
HTTP 400
[Asserts]
body contains "google login: no client id associated with auth source"

# Set the google auth source config client id value
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/tests/testsite/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/core.google_auth_client_id",
                    "uesio/core.value":"A Totally Valid Token"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Verify that the google auth source config client id value was set
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/tests/testsite/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "fields": [],
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].data[4]['uesio/core.namespace']" == "uesio/core"
jsonpath "$.wires[0].data[4]['uesio/core.name']" == "google_auth_client_id"
jsonpath "$.wires[0].data[4]['uesio/core.value']" == "A Totally Valid Token"

# Log in to google with missing credentials
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/google/login
{}
HTTP 400
[Asserts]
body contains "google login: key 'credential' not present in payload"

# Log in to google with the wrong client id
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/google/login
[Options]
# JWT from jwt.io with aud = "I found this token on the internet. Will it work?"
variable: jwt="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiYXVkIjoiSSBmb3VuZCB0aGlzIHRva2VuIG9uIHRoZSBpbnRlcm5ldC4gV2lsbCBpdCB3b3JrPyJ9.JbkUad_BcG7QGR-GspdZf9L2Erd-fdYPU9Y3_mZgHFQOtPztcaH8AbbEZZN1JUtJEOY5d17rchinGKNL11ET4RNoYm3_JgvlVsyh7gwpPVla9tzJdBIkACUmg7HvKQkKhinwDPg1RDZZ2B2TkAu_ua26VFeR_xYq7iFjrROwLBsLKvlU7JJyI8fwI5pvQ8sugu2qmOfxgDWKDOh6yL51BXXHbAxi6AP5waZIEk7nSYDwj7Snt0VySdp_h-OC5_BUQFAA1cEaNYEePj1CbCTPifxrzTPwkUxyJA2iA4bXJnKS5e6zm8SHZwCTI1qrc8DiBGEHgiy5Ggafaf7hEFC1PQ"
{
    "credential": "{{jwt}}"
}
HTTP 400
[Asserts]
body contains "idtoken: audience provided does not match aud claim in the JWT"

# Now try to set the token in a workspace and then try to login

# Unset the google auth source config client id value
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/core.google_auth_client_id",
                    "uesio/core.value":""
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Verify that the google auth source config client id value was unset
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "fields": [],
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].data[4]['uesio/core.namespace']" == "uesio/core"
jsonpath "$.wires[0].data[4]['uesio/core.name']" == "google_auth_client_id"
jsonpath "$.wires[0].data[4]['uesio/core.value']" == ""

# Log in to google in the workspace context (it should not have a client id set
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/auth/uesio/core/google/login
{
    "credential": "A Random Credential",
    "client_id": "A Totally Different Valid Token"
}
HTTP 400
[Asserts]
body contains "google login: no client id associated with auth source"

# Set the google auth source config client id value
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "changes":{
                "temp1":{
                    "uesio/core.id":"uesio/core.google_auth_client_id",
                    "uesio/core.value":"A Valid Token for Workspace"
                }
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Verify that the google auth source config client id value was set
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.configvalue",
            "fields": [],
            "query":true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 5
jsonpath "$.wires[0].data[4]['uesio/core.namespace']" == "uesio/core"
jsonpath "$.wires[0].data[4]['uesio/core.name']" == "google_auth_client_id"
jsonpath "$.wires[0].data[4]['uesio/core.value']" == "A Valid Token for Workspace"

# Log in to google with the wrong client id
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/auth/uesio/core/google/login
[Options]
# JWT from jwt.io with aud = "A Totally Different Valid Token"
variable: jwt="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiYXVkIjoiQSBUb3RhbGx5IERpZmZlcmVudCBWYWxpZCBUb2tlbiJ9.PVA9GfcR5hH9FZCmRHdBgY6X6aoQsC69ukMz0h20HFFCndAogMKfdPBj0tRoYTomBTKteKJ7qkfZReV87MXUT3eS5mmgA6CjPClg9CjpLuOy16odaLjwgQx4SVZ-7x_u_WvfMZr6cPx_M4eozjLcIrR7ZGFnMyrTXSHKjC7sEbUHAPvgmsXAcgeeW9AN4N4mkr-R2Maj-8EKq-g2a5dXroQhskw0DX5kQx-q-9N1eqxVBHU8WGwmfdVg-eXGR3kTW9FeKR01yfrkDtPkHiN0DcUTZSxnDc5gmBa8V1G8meIehht6AGnluwZwdK7pGGXkSDZjWQ_WvAFtHHrIq44KRA"
{
    "credential": "{{jwt}}"
}
HTTP 400
[Asserts]
body contains "idtoken: audience provided does not match aud claim in the JWT"

# Verify that if you try to log in with a workspace context you get an error
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 400
[Asserts]
body contains "login isn't currently supported for workspaces"
