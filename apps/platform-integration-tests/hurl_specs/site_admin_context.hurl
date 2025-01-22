# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Try to administer the tests site as the owner of the app
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/wires/load
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

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "ben"
}

# Try to administer the tests site as a team member of the app
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/wires/load
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

POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "abel"
}

# Try (and fail) to administer the tests site as an outsider (sorry abel)
POST https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/wires/load
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
header "Location" == "/login?r=/siteadmin/uesio/tests/testsite/wires/load&expired=true"

