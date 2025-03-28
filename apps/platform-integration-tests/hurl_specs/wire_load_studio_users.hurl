##############################################
# Tests access to User records in the Studio
##############################################

# Log into the studio as ben user
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}

# Delete the sample ORG user if it exists
DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/api/v1/collection/uesio/core/user?uesio/core.username=eq.testorguser
HTTP *
[Asserts]
status toString matches /^(204|404)$/

# Create a new sample ORG user
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
{
    "wires": [
        {
            "wire": "neworguser",
            "collection": "uesio/core.user",
            "changes": {
                "1": {
                    "uesio/core.firstname": "Sample",
                    "uesio/core.lastname": "User",
                    "uesio/core.type": "ORG",
                    "uesio/core.username": "testorguser",
                    "uesio/core.profile": {
                        "uesio/core.uniquekey": "uesio/studio.standard"
                    }
                }
            },
            "upsert": true
        }
    ]
}
HTTP 200
[Captures]
testuserid: jsonpath "$.wires[0].changes['1']['uesio/core.id']"
[Asserts]
jsonpath "$.wires[0].errors" == null

# since ben is the owner of the user, ben should be able to see the user with/without write access
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.user",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "testorguser"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "testorguser"
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "{{testuserid}}"

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.user",
            "query":true,
            "requirewriteaccess":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "testorguser"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "testorguser"
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "{{testuserid}}"

# Now login as uesio user
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Verify that uesio user CAN see the sample ORG user with a basic query
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.user",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "testorguser"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "testorguser"
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "{{testuserid}}"

# Verify that uesio user CANNOT see the sample ORG user when we require write access
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.user",
            "query":true,
            "requirewriteaccess":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "testorguser"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 0

# Try adding an organizationuser record to this org as uesio
# This should FAIL since we Uesio is not the owner and doesn't have write access to that org
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
{
    "wires": [
        {
            "wire": "neworguser",
            "collection": "uesio/core.organizationuser",
            "changes": {
                "1": {
                    "uesio/core.user": {
                        "uesio/core.uniquekey": "uesio"
                    },
                    "uesio/core.org": {
                        "uesio/core.uniquekey": "testorguser"
                    }
                }
            },
            "upsert": true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" count == 1
jsonpath "$.wires[0].errors[0].message" == "User does not have parent access to write to this record: uesio:testorguser of collection: uesio/core.organizationuser"

# now, login as Ben and do the same thing,
# which should succeed since ben is the owner of the org and has write access
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}
HTTP 200

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/save
{
    "wires": [
        {
            "wire": "neworguser",
            "collection": "uesio/core.organizationuser",
            "changes": {
                "1": {
                    "uesio/core.user": {
                        "uesio/core.uniquekey": "uesio"
                    },
                    "uesio/core.org": {
                        "uesio/core.uniquekey": "testorguser"
                    }
                }
            },
            "upsert": true
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
jsonpath "$.wires[0].changes['1']['uesio/core.id']" not isEmpty

# Okay, go back to uesio.
# Now we SHOULD be able to see the testorguser
# on account of the new organizationuser record,
# which should grant uesio access to the org
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.user",
            "query":true,
            "requirewriteaccess":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "testorguser"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "{{testuserid}}"

# Verify that OTHER users for which there is NOT an organizationuser record
# CANNOT see the sample ORG user when we require write access
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "abel"
}
HTTP 200

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.user",
            "query":true,
            "requirewriteaccess":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "testorguser"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 0

# Try to delete the test user (as abel, who does not have write access), it should fail
DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/api/v1/collection/uesio/core/user?uesio/core.username=eq.testorguser
HTTP 400

# login again as uesio, who has write access
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

DELETE {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/api/v1/collection/uesio/core/user?uesio/core.username=eq.testorguser
HTTP 204
