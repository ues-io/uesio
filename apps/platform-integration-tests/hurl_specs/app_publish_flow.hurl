###########################################################################
# Tests the App Publish Flow 
# IMPORTANT NOTE --> this tests must run before bundle_store_apis.hurl
###########################################################################

# Log into the studio as uesio the owner of the test app
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Get the dev workspace id so we can test saving collections/fields
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.app",
            "name": "app",
            "query":true,
            "fields": [
                {
                    "id": "uesio/core.id"
                },
                {
                    "id": "uesio/studio.fullname"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/studio.fullname",
                    "value": "uesio/tests"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/studio.fullname']" == "uesio/tests"
[Captures]
app_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# 1 step create a new bundlelisting with status OPEN
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.bundlelisting",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.app": {
                        "uesio/core.id": "{{app_id}}"
                    },
                    "uesio/studio.description": "Integration tests",
                    "uesio/studio.status": "OPEN"
                }
            },
            "params": {
                "app": "uesio/tests"
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
[Captures]
tests_app_bundlelisting_id: jsonpath "$.wires[0].changes['temp1']['uesio/core.id']"

# 2 step add a new license template
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.licensetemplate",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.app": {
                        "uesio/core.id": "{{app_id}}"
                    },
                    "uesio/studio.autocreate": true,
                    "uesio/studio.monthlyprice": 10
                }
            },
            "params": {
                "app": "uesio/tests"
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# 3 step Send it for review
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.bundlelisting",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id": "{{tests_app_bundlelisting_id}}",
                    "uesio/studio.status": "SUBMITTED"
                }
            },
            "params": {
                "app": "uesio/tests"
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

#Login as Abel he has access to the studio site
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "abel"
}
HTTP 200

#Site admin 
# 4 step Start the review
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/studio/prod/wires/save
{
  "wires": [
    {
      "wire": "siteAdminStudioSave",
      "collection": "uesio/studio.bundlelisting",
      "changes": {
        "temp1":{
            "uesio/core.id": "{{tests_app_bundlelisting_id}}",
            "uesio/studio.status": "IN_REVIEW"
        }
      },
      "params": {
        "app": "uesio/studio",
        "appBundle": "uesio/tests",
        "sitename": "prod"
      }
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

#Site admin 
# 5 step Approve the app
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/studio/prod/wires/save
{
  "wires": [
    {
      "wire": "siteAdminStudioSave",
      "collection": "uesio/studio.bundlelisting",
      "changes": {
        "temp1":{
            "uesio/core.id": "{{tests_app_bundlelisting_id}}",
            "uesio/studio.approved": true,
            "uesio/studio.status": "APPROVED"
        }
      },
      "params": {
        "app": "uesio/studio",
        "appBundle": "uesio/tests",
        "sitename": "prod"
      }
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Log into the studio as uesio the owner of the test app
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# 6 step Make it public & publish it
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.bundlelisting",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id": "{{tests_app_bundlelisting_id}}",
                    "uesio/studio.status": "PUBLISHED"
                }
            },
            "params": {
                "app": "uesio/tests"
            },
            "wire":"mywire"
        },
        {
            "collection":"uesio/studio.app",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id": "{{app_id}}",
                    "uesio/studio.public": true
                }
            },
            "params": {
                "app": "uesio/tests"
            },
            "wire":"mywire2"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# 7 step get a the 0.0.1 bundle for the tests app and make it public 
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.bundle",
            "batchsize": 1,
            "query":true,
            "fields": [
                {
                    "id": "uesio/studio.major"
                },
                {
                    "id": "uesio/studio.minor"
                },
                {
                    "id": "uesio/studio.patch"
                },
                {
                    "id": "uesio/core.uniquekey"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "uesio/tests:0:0:1"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/studio.major']" == 0
jsonpath "$.wires[0].data[0]['uesio/studio.minor']" == 0
jsonpath "$.wires[0].data[0]['uesio/studio.patch']" == 1
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests:0:0:1"
[Captures]
bundle_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# 7.1 step make it public 
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.bundle",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id": "{{bundle_id}}",
                    "uesio/studio.published": true
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Get published versions for the tests/app bundle
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bundles/v1/versions/uesio/tests/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$" count >= 1
jsonpath "$" count <= 5
jsonpath "$[*].version" exists
jsonpath "$[*].description" exists
jsonpath "$[0].description" == "test bundle"
jsonpath "$[0].version" == "v0.0.1"