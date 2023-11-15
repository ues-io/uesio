###################################################################
# Tests the metadata listing api for the siteadmin context
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Get a list of all available namespaces from a siteadmin context
GET https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/metadata/namespaces
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$" count == 4
jsonpath "$[0]" == "uesio/tests"
jsonpath "$[1]" == "uesio/builder"
jsonpath "$[2]" == "uesio/core"
jsonpath "$[3]" == "uesio/io"

# Get a list of all collections available from a siteadmin context
GET https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/metadata/types/collections/list
Accept: application/json
HTTP 200
[Asserts]
# There are currently 11 public uesio/core collections and 9 uesio/test collections
# we want to bring this number down at some point by making most of the uesio/core
# collections private.
jsonpath "$[*]" count == 20
# Spot check a uesio/tests collection
jsonpath "$['uesio/tests.animal'].key" == "uesio/tests.animal"
jsonpath "$['uesio/tests.animal'].namespace" == "uesio/tests"
# Spot check a uesio/core collection
jsonpath "$['uesio/core.user'].key" == "uesio/core.user"
jsonpath "$['uesio/core.user'].namespace" == "uesio/core"
jsonpath "$['uesio/core.secretstorevalue']" not exists

# Get a list of collections in the uesio/test namespace available from a siteadmin context
GET https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/metadata/types/collections/namespace/uesio/tests/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 9
# Spot check a uesio/tests collection
jsonpath "$['uesio/tests.animal'].key" == "uesio/tests.animal"
jsonpath "$['uesio/tests.animal'].namespace" == "uesio/tests"

# Get a list of collections in the uesio/core namespace available from a siteadmin context
GET https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/metadata/types/collections/namespace/uesio/core/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 11
# Spot check a uesio/core collection
jsonpath "$['uesio/core.user'].key" == "uesio/core.user"
jsonpath "$['uesio/core.user'].namespace" == "uesio/core"
jsonpath "$['uesio/core.secretstorevalue']" not exists

# Get a list of all fields from the animal collection available from a siteadmin context
GET https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/metadata/types/fields/list/uesio/tests.animal
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 14
# Spot check a uesio/tests field
jsonpath "$['uesio/tests.genus'].key" == "uesio/tests.genus"
jsonpath "$['uesio/tests.genus'].namespace" == "uesio/tests"
# Spot check a uesio/core fields
jsonpath "$['uesio/core.id'].key" == "uesio/core.id"
jsonpath "$['uesio/core.id'].namespace" == "uesio/core"

# Get a list of uesio/tests fields from the animal collection available from a siteadmin context
GET https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/metadata/types/fields/namespace/uesio/tests/list/uesio/tests.animal
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 7
# Spot check a uesio/tests field
jsonpath "$['uesio/tests.genus'].key" == "uesio/tests.genus"
jsonpath "$['uesio/tests.genus'].namespace" == "uesio/tests"

# Get a list of all secrets available from a siteadmin context
GET https://{{host}}:{{port}}/siteadmin/uesio/tests/testsite/metadata/types/secrets/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 5
jsonpath "$['uesio/core.sendgridkey'].key" == "uesio/core.sendgridkey"
jsonpath "$['uesio/core.sendgridkey'].namespace" == "uesio/core"
jsonpath "$['uesio/core.sendgridkey'].icon" == "hub"
jsonpath "$['uesio/tests.test_oauth_client_id'].key" == "uesio/tests.test_oauth_client_id"
jsonpath "$['uesio/tests.test_oauth_client_id'].namespace" == "uesio/tests"
jsonpath "$['uesio/tests.test_oauth_client_secret'].key" == "uesio/tests.test_oauth_client_secret"
jsonpath "$['uesio/tests.test_oauth_client_secret'].namespace" == "uesio/tests"
jsonpath "$['uesio/tests.test_session_id'].key" == "uesio/tests.test_session_id"
jsonpath "$['uesio/tests.test_session_id'].namespace" == "uesio/tests"
