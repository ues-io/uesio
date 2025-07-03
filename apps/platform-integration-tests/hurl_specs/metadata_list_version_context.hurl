###################################################################
# Tests the metadata listing api for the version context
###################################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Get a list of all available namespaces from a version context
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/version/uesio/tests/v0.0.1/metadata/namespaces
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$" count == 5
jsonpath "$[0]" == "uesio/tests"
jsonpath "$[1]" == "uesio/aikit"
jsonpath "$[2]" == "uesio/appkit"
jsonpath "$[3]" == "uesio/core"
jsonpath "$[4]" == "uesio/io"

# Get a list of all collections available from a version context
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/version/uesio/tests/v0.0.1/metadata/types/collections/list
Accept: application/json
HTTP 200
[Asserts]
# this number should be the sum of the number of collections in core, tests, aikit & appkit
# TODO: Unclear why this assert exists as its fragile and likely does not help in any way since underlying
# data can change across the test suite.  Evaluate this tests purpose and adjust the assert to be
# explicit/more meaningful or remove.
jsonpath "$[*]" count == 29
# Spot check a uesio/tests collection
jsonpath "$['uesio/tests.animal'].key" == "uesio/tests.animal"
jsonpath "$['uesio/tests.animal'].namespace" == "uesio/tests"
# Spot check a uesio/core collection
jsonpath "$['uesio/core.user'].key" == "uesio/core.user"
jsonpath "$['uesio/core.user'].namespace" == "uesio/core"
jsonpath "$['uesio/core.secretstorevalue']" not exists

# Get a list of collections in the uesio/test namespace available from a version context
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/version/uesio/tests/v0.0.1/metadata/types/collections/namespace/uesio/tests/list
Accept: application/json
HTTP 200
[Asserts]
# this number should be the number of collections in tests
# TODO: Unclear why this assert exists as its fragile and likely does not help in any way since underlying
# data can change across the test suite.  Evaluate this tests purpose and adjust the assert to be
# explicit/more meaningful or remove.
jsonpath "$[*]" count == 11
# Spot check a uesio/tests collection
jsonpath "$['uesio/tests.animal'].key" == "uesio/tests.animal"
jsonpath "$['uesio/tests.animal'].namespace" == "uesio/tests"

# Get a list of collections in the uesio/core namespace available from a version context
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/version/uesio/tests/v0.0.1/metadata/types/collections/namespace/uesio/core/list
Accept: application/json
HTTP 200
[Asserts]
# this number should be the number of collections in core
# TODO: Unclear why this assert exists as its fragile and likely does not help in any way since underlying
# data can change across the test suite.  Evaluate this tests purpose and adjust the assert to be
# explicit/more meaningful or remove.
jsonpath "$[*]" count == 15
# Spot check a uesio/core collection
jsonpath "$['uesio/core.user'].key" == "uesio/core.user"
jsonpath "$['uesio/core.user'].namespace" == "uesio/core"
jsonpath "$['uesio/core.secretstorevalue']" not exists

# Get a list of all fields from the animal collection available from a version context
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/version/uesio/tests/v0.0.1/metadata/types/fields/list/uesio/tests.animal
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 18
# Spot check a uesio/tests field
jsonpath "$['uesio/tests.genus'].key" == "uesio/tests.genus"
jsonpath "$['uesio/tests.genus'].namespace" == "uesio/tests"
# Spot check a uesio/core fields
jsonpath "$['uesio/core.id'].key" == "uesio/core.id"
jsonpath "$['uesio/core.id'].namespace" == "uesio/core"

# Get a list of uesio/tests fields from the animal collection available from a version context
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/version/uesio/tests/v0.0.1/metadata/types/fields/namespace/uesio/tests/list/uesio/tests.animal
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 9
# Spot check a uesio/tests field
jsonpath "$['uesio/tests.genus'].key" == "uesio/tests.genus"
jsonpath "$['uesio/tests.genus'].namespace" == "uesio/tests"

# Get a list of all secrets available from a version context
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/version/uesio/tests/v0.0.1/metadata/types/secrets/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 5
jsonpath "$['uesio/appkit.resend_key'].key" == "uesio/appkit.resend_key"
jsonpath "$['uesio/appkit.resend_key'].namespace" == "uesio/appkit"
jsonpath "$['uesio/appkit.resend_key'].icon" == "apps"
jsonpath "$['uesio/tests.test_oauth_client_id'].key" == "uesio/tests.test_oauth_client_id"
jsonpath "$['uesio/tests.test_oauth_client_id'].namespace" == "uesio/tests"
jsonpath "$['uesio/tests.test_oauth_client_secret'].key" == "uesio/tests.test_oauth_client_secret"
jsonpath "$['uesio/tests.test_oauth_client_secret'].namespace" == "uesio/tests"
jsonpath "$['uesio/tests.test_session_id'].key" == "uesio/tests.test_session_id"
jsonpath "$['uesio/tests.test_session_id'].namespace" == "uesio/tests"

# Now go into the uesio/core version context and get the secrets
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/version/uesio/core/v0.0.1/metadata/types/secrets/list
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$[*]" count == 6
