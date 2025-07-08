############################################################
# Outputs performance data for the duration of the test run
############################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Run the perf stats job
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/perf/stats
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.queryStats.totalQueries" > 1
jsonpath "$.queryStats.queriesByCollection['uesio/studio.workspace']" > 1
