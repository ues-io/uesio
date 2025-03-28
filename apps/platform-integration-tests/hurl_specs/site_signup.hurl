# Verify that if self-signup on a signup method is NOT enabled,
# an error is returned when you attempt to sign up for a new account.
POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/tests/noselfsignup/signup
[Options]
# This was previously using {{unix_epoch_seconds}} to create random value, however hurl does not currently have a way
# to randomly generate data that satisfies our validation of letter/digit/underscore only.  For these tests, we do not
# need random data since all of our tests require that the tests-init script be run to create the data before every
# execution anyway.  The benefit of having user_suffix be random is that it would allow this individual file to execute
# on its own without having to re-run tests-init every time, however the way all these tests are written, they don't
# lend themselves to that execution style anyway.  For now, changing to fixed value but could potentially revisit if/when
# hurl extends its built-in function support for random data (see https://github.com/Orange-OpenSource/hurl/issues/3720)
variable: user_suffix="12345"
{
    "username": "test_signup_user_{{user_suffix}}",
    "password": "1479182734abcdEFGHJ%(",
    "firstname": "Test",
    "lastname": "User",
    "email": "tester_{{user_suffix}}@ues.io"
}
HTTP 403
[Asserts]
body == "this site does not support self-signup\n"

# Test creating a new user in the tests site using the "tester" signup method

POST {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/tests/tester/signup
{
    "username": "test_signup_user_{{user_suffix}}",
    "password": "1479182734abcdEFGHJ%(",
    "firstname": "Test",
    "lastname": "User",
    "email": "tester_{{user_suffix}}@ues.io"
}
HTTP 200

POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Verify that an "email" was sent by checking that an email_log was generated,
# and extract out the verification code, so that we can confirm the signup
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/siteadmin/uesio/tests/testsite/wires/load
{
    "wires": [
        {
            "collection": "uesio/tests.email_log",
            "query": true,
            "fields": [
                {
                    "id": "uesio/tests.verification_code"
                },
                {
                    "id": "uesio/tests.link"
                }
            ],
            "batchsize": 1,
            "conditions": [
                {
                    "field": "uesio/tests.to_emails",
                    "value": "[\"tester_{{user_suffix}}@ues.io\"]"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "sitename": "testsite"
            }
        },
        {
            "collection": "uesio/core.user",
            "query": true,
            "fields": [
                {
                    "id": "uesio/core.username"
                },
                {
                    "id": "uesio/core.firstname"
                },
                {
                    "id": "uesio/core.lastname"
                },
                {
                    "id": "uesio/core.email"
                }
            ],
            "batchsize": 1,
            "conditions": [
                {
                    "field": "uesio/core.email",
                    "value": "tester_{{user_suffix}}@ues.io"
                }
            ],
            "params": {
                "app": "uesio/tests",
                "sitename": "testsite"
            }
        }
    ]
}

# Extract the verification code and link from the email_log,
# and verify that the user was created.
HTTP 200
[Captures]
verification_code: jsonpath "$.wires[0].data[0]['uesio/tests.verification_code']"
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.wires[0].data[0]['uesio/tests.verification_code']" exists
jsonpath "$.wires[0].data[0]['uesio/tests.link']" exists
jsonpath "$.wires[1].data" count == 1
jsonpath "$.wires[1].data[0]['uesio/core.username']" == "test_signup_user_{{user_suffix}}"
jsonpath "$.wires[1].data[0]['uesio/core.email']" == "tester_{{user_suffix}}@ues.io"
jsonpath "$.wires[1].data[0]['uesio/core.firstname']" == "Test"
jsonpath "$.wires[1].data[0]['uesio/core.lastname']" == "User"

# Confirm the signup using the verification code
GET {{site_scheme}}://tests.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/tests/tester/signup/confirm?code={{verification_code}}&username=test_signup_user_{{user_suffix}}
HTTP 302
[Asserts]
header "Location" == "/"