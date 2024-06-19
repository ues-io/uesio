###################################################################
# Tests the metadata listing api for the workspace context
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Get a list of all available namespaces from a workspace context
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/namespaces
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$" count == 5
jsonpath "$[0]" == "uesio/tests"
jsonpath "$[1]" == "uesio/aikit"
jsonpath "$[2]" == "uesio/builder"
jsonpath "$[3]" == "uesio/core"
jsonpath "$[4]" == "uesio/io"

# Get a list of all collections available from a workspace context
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/types/collections/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == {{num_core_and_tests_collections}}
# Spot check a uesio/tests collection
jsonpath "$['uesio/tests.animal'].key" == "uesio/tests.animal"
jsonpath "$['uesio/tests.animal'].namespace" == "uesio/tests"
# Spot check a uesio/core collection
jsonpath "$['uesio/core.user'].key" == "uesio/core.user"
jsonpath "$['uesio/core.user'].namespace" == "uesio/core"
jsonpath "$['uesio/core.secretstorevalue']" not exists

# Get a list of collections in the uesio/test namespace available from a workspace context
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/types/collections/namespace/uesio/tests/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == {{num_tests_collections}}
# Spot check a uesio/tests collection
jsonpath "$['uesio/tests.animal'].key" == "uesio/tests.animal"
jsonpath "$['uesio/tests.animal'].namespace" == "uesio/tests"

# Get a list of collections in the uesio/core namespace available from a workspace context
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/types/collections/namespace/uesio/core/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == {{num_public_core_collections}}
# Spot check a uesio/core collection
jsonpath "$['uesio/core.user'].key" == "uesio/core.user"
jsonpath "$['uesio/core.user'].namespace" == "uesio/core"

# Get a list of all fields from the animal collection available from a workspace context
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/types/fields/list/uesio/tests.animal
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 16
# Spot check a uesio/tests field
jsonpath "$['uesio/tests.genus'].key" == "uesio/tests.genus"
jsonpath "$['uesio/tests.genus'].namespace" == "uesio/tests"
# Spot check a uesio/core fields
jsonpath "$['uesio/core.id'].key" == "uesio/core.id"
jsonpath "$['uesio/core.id'].namespace" == "uesio/core"

# Get a list of uesio/tests fields from the animal collection available from a workspace context
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/types/fields/namespace/uesio/tests/list/uesio/tests.animal
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 8
# Spot check a uesio/tests field
jsonpath "$['uesio/tests.genus'].key" == "uesio/tests.genus"
jsonpath "$['uesio/tests.genus'].namespace" == "uesio/tests"

# Get a list of all secrets available from a workspace context
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/metadata/types/secrets/list
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
