# Log into the studio as uesio
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200
[Captures]
uesio_user_id: jsonpath "$.user.id"

# Get the workspace id
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.workspace",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "uesio/tests:dev"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "uesio/tests:dev"
[Captures]
workspace_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# Get the evil corp's id
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Evil Corp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "Evil Corp"
[Captures]
account_id: jsonpath "$.wires[0].data[0]['uesio/core.id']"


# Log into the studio as ben
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}
HTTP 200

# Add an impersonation record to use the rep profile
POST https://{{host}}:{{port}}/site/bots/call/uesio/studio/setworkspaceuser
{
    "workspaceid": "{{workspace_id}}",
    "profile": "uesio/tests.rep"
}
HTTP 200

# Now that I'm impersonating with the rep profile, I can't see the evil corp.
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Evil Corp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" isEmpty

# Log into the studio as uesio
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Put ben on the account team
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.accountteammember",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/tests.account":{
                        "uesio/core.uniquekey": "Evil Corp"
                    },
                    "uesio/tests.member":{
                        "uesio/core.uniquekey": "ben"
                    }
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# Log into the studio as ben
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}

# Now that ben is on the account team, he can see the evil corp.
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Evil Corp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "Evil Corp"

# Check the record challenge tokens associated with evil corp
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.recordtokenvalue",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/studio.recordid",
                    "value": "{{account_id}}"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/studio.recordid']" == "{{account_id}}"
jsonpath "$.wires[0].data[1]['uesio/studio.recordid']" == "{{account_id}}"
jsonpath "$.wires[0].data[*]['uesio/studio.token']" contains "uesio.owner:{{uesio_user_id}}"
jsonpath "$.wires[0].data[*]['uesio/studio.token']" contains "uesio/tests.accountmember:{{account_id}}"

# Remove record challenge tokens from the account object
DELETE https://{{host}}:{{port}}/site/api/v1/collection/uesio/studio/recordchallengetoken?uesio/studio.collection=eq.uesio%2Ftests.account
x-uesio-app: uesio/tests
x-uesio-workspacename: dev
HTTP 204

# Verify that the tokens are gone
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.recordchallengetoken",
            "query": true,
            "conditions": [
                {
                    "field": "uesio/studio.collection",
                    "value": "uesio/tests.account"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 0

# Ben immeditately loses access because the user access tokens are no longer calculated
# for account team members (however for other cases, like when we add a record access token,
# the effect will not be immediate. Ideally, when record access tokens become automatic,
# we'll be able to remove this check altogether. But for now it will be nice to have this
# test so we can be alerted when this behavior changes.
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Evil Corp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" isEmpty

# Call the refresh tokens bot
POST https://studio.uesio-dev.com:3000/site/bots/call/uesio/studio/resetrecordaccesstokens
{
    "collection": "uesio/tests.account",
    "workspacename": "dev",
    "app": "uesio/tests"
}
HTTP 200

# Check the record challenge tokens associated with evil corp
# Verify that the token for the teammember is gone, but the owner token stayed
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.recordtokenvalue",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/studio.recordid",
                    "value": "{{account_id}}"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/studio.recordid']" == "{{account_id}}"
jsonpath "$.wires[0].data[0]['uesio/studio.token']" == "uesio.owner:{{uesio_user_id}}"
jsonpath "$.wires[0].data[0]['uesio/studio.tokentype']" == "uesio.owner"
jsonpath "$.wires[0].data[0]['uesio/studio.relatedrecordid']" == "{{uesio_user_id}}"

# Now the tokens are gone and ben can't see the evil corp
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Evil Corp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" isEmpty

# Now add the record challenge tokens back to the account object
POST https://{{host}}:{{port}}/site/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection": "uesio/studio.recordchallengetoken",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/studio.name": "account",
                    "uesio/studio.collection":"uesio/tests.account",
                    "uesio/studio.token": "${uesio/core.id}",
                    "uesio/studio.useraccesstoken": "uesio/tests.accountmember",
                    "uesio/studio.access": "readwrite"
                }
            },
            "wire":"mywire",
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null

# In this case, the tokens haven't been refreshed yet, so ben can still not see evil corp
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Evil Corp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" isEmpty

# Call the refresh tokens bot
POST https://studio.uesio-dev.com:3000/site/bots/call/uesio/studio/resetrecordaccesstokens
{
    "collection": "uesio/tests.account",
    "workspacename": "dev",
    "app": "uesio/tests"
}
HTTP 200

# The tokens should be back to normal
POST https://{{host}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/studio.recordtokenvalue",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/studio.recordid",
                    "value": "{{account_id}}"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "workspacename": "dev"
            }
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/studio.recordid']" == "{{account_id}}"
jsonpath "$.wires[0].data[1]['uesio/studio.recordid']" == "{{account_id}}"
jsonpath "$.wires[0].data[*]['uesio/studio.token']" contains "uesio.owner:{{uesio_user_id}}"
jsonpath "$.wires[0].data[*]['uesio/studio.token']" contains "uesio/tests.accountmember:{{account_id}}"

# We're back! ben can now see evil corp
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.account",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "Evil Corp"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "Evil Corp"

# Remove impersonation record to reset to orignal state
POST https://{{host}}:{{port}}/site/bots/call/uesio/studio/setworkspaceuser
{
    "workspaceid": "{{workspace_id}}",
    "profile": ""
}
HTTP 200

