# Log into the studio as uesio
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Workspace users can access everything
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

# Log into a real site as chad
POST https://tests.{{domain}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"chad\"}"
}
HTTP 200

# Verify that we're logged in correctly
GET https://tests.{{domain}}:{{port}}/site/auth/check
HTTP 200
[Asserts]
jsonpath "$.user.profile" == "uesio/tests.rep"
jsonpath "$.user.username" == "chad"

# Chad can see an account that he's on the team of
POST https://tests.{{domain}}:{{port}}/site/wires/load
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

# Chad can see a contact from an account that he's on the team of
POST https://tests.{{domain}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.contact",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "George:Willson"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[0]['uesio/core.uniquekey']" == "George:Willson"

# Logout
POST https://tests.{{domain}}:{{port}}/site/auth/logout
HTTP 200

# Log in as vlad
POST https://tests.{{domain}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"vlad\"}"
}
HTTP 200

# Verify that we're logged in correctly
GET https://tests.{{domain}}:{{port}}/site/auth/check
HTTP 200
[Asserts]
jsonpath "$.user.profile" == "uesio/tests.rep"
jsonpath "$.user.username" == "vlad"

# Vlad cannot see an account that he's not on the team of
POST https://tests.{{domain}}:{{port}}/site/wires/load
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
jsonpath "$.wires[0].data[*]" isEmpty

# Vlad cannot see a contact from an account that he's not on the team of
POST https://tests.{{domain}}:{{port}}/site/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.contact",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "George:Willson"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
